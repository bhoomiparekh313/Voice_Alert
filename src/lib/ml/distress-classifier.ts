/**
 * VANI Distress Classifier
 * Implements the paper's hybrid approach:
 *   Trigger = KeywordMatch ∨ (P(y=1|x) ≥ τ)
 *
 * Pipeline: Text → Preprocessing → TF-IDF → Logistic Regression → Probability
 * Combined with keyword matching for the final trigger decision.
 */

import { TfIdfVectorizer } from './tfidf';
import { LogisticRegression } from './logistic-regression';
import { TRAINING_DATA } from './training-data';

// ── Emergency keyword sets (weighted) ─────────────────────────
const EMERGENCY_KEYWORDS: Record<string, { word: string; weight: number }[]> = {
  english: [
    { word: 'help', weight: 0.7 }, { word: 'help me', weight: 0.9 },
    { word: 'save me', weight: 0.95 }, { word: 'please help', weight: 0.9 },
    { word: 'emergency', weight: 0.95 }, { word: 'sos', weight: 1.0 },
    { word: 'call police', weight: 1.0 }, { word: 'im in danger', weight: 1.0 },
    { word: 'someone help', weight: 0.85 }, { word: 'help me now', weight: 0.95 },
    { word: 'im scared', weight: 0.6 }, { word: 'theyre attacking me', weight: 1.0 },
    { word: 'im in trouble', weight: 0.85 }, { word: 'fire', weight: 0.7 },
    { word: 'leave me alone', weight: 0.8 }, { word: 'get away', weight: 0.75 },
    { word: 'dont touch me', weight: 0.9 }, { word: 'call ambulance', weight: 1.0 },
  ],
  hindi: [
    { word: 'bachao', weight: 0.95 }, { word: 'madad', weight: 0.85 },
    { word: 'mujhe bachao', weight: 1.0 }, { word: 'koi bachao', weight: 0.95 },
    { word: 'help karo', weight: 0.85 }, { word: 'police bulao', weight: 1.0 },
    { word: 'main danger mein hoon', weight: 1.0 },
    { word: 'jaldi help karo', weight: 0.9 }, { word: 'chhodo mujhe', weight: 0.85 },
    { word: 'mat chuo', weight: 0.9 },
  ],
  marathi: [
    { word: 'vachva', weight: 0.95 }, { word: 'madad kara', weight: 0.85 },
    { word: 'koni tari vachva', weight: 0.95 }, { word: 'police bola', weight: 1.0 },
    { word: 'aag lagali', weight: 0.95 }, { word: 'mala vachva', weight: 0.95 },
  ],
};

export const ALL_KEYWORDS = Object.values(EMERGENCY_KEYWORDS).flat().map(k => k.word);

// ── Distress context words for co-occurrence boost ────────────
const DISTRESS_CONTEXT = [
  'please', 'now', 'hurry', 'fast', 'quick', 'scared', 'afraid', 'danger',
  'hurt', 'bleeding', 'attack', 'kill', 'die', 'run', 'escape', 'trapped',
  'jaldi', 'dar', 'daro', 'maro', 'maar',
];

// ── Classification result ─────────────────────────────────────
export interface ClassificationResult {
  isDistress: boolean;
  mlProbability: number;
  keywordScore: number;
  keywordMatch: string;
  keywordLanguage: string;
  contextBoost: number;
  repetitionBoost: number;
  audioEnergyBoost: number;
  finalScore: number;
  triggerSource: 'keyword' | 'ml' | 'hybrid' | 'none';
}

/**
 * Main classifier class — trains on init, then classifies in real-time.
 * Designed for browser execution with the small curated dataset.
 */
export class DistressClassifier {
  private vectorizer: TfIdfVectorizer;
  private model: LogisticRegression;
  private recentTranscripts: string[] = [];
  private ready = false;

  constructor() {
    this.vectorizer = new TfIdfVectorizer();
    this.model = new LogisticRegression();
  }

  /** Train the TF-IDF + LR pipeline on the curated dataset */
  train(): this {
    const texts = TRAINING_DATA.map(s => s.text);
    const labels = TRAINING_DATA.map(s => s.label);

    // Fit TF-IDF vectorizer
    this.vectorizer.fit(texts);

    // Transform training data
    const X = this.vectorizer.transformBatch(texts);

    // Train Logistic Regression
    this.model.fit(X, labels, {
      learningRate: 0.5,
      epochs: 500,
      lambda: 0.01,
    });

    this.ready = true;
    console.log(`[VANI ML] Model trained — vocab size: ${this.vectorizer.vocabSize}, samples: ${texts.length}`);
    return this;
  }

  /**
   * Hybrid classification: Keyword ∨ ML(P≥τ)
   * Combines keyword matching, ML probability, context, repetition, and audio energy.
   */
  classify(
    text: string,
    options: {
      mlThreshold?: number;     // τ from the paper (default 0.60)
      audioEnergy?: number;     // 0-1 from Web Audio API
    } = {}
  ): ClassificationResult {
    const { mlThreshold = 0.60, audioEnergy = 0 } = options;
    const lower = text.toLowerCase().trim();

    if (!lower || !this.ready) {
      return this.emptyResult();
    }

    // ── 1. ML Probability via TF-IDF + Logistic Regression ──
    const featureVec = this.vectorizer.transform(lower);
    const mlProbability = this.model.predictProbability(featureVec);

    // ── 2. Keyword matching (best weighted match) ───────────
    let keywordScore = 0;
    let keywordMatch = '';
    let keywordLanguage = 'english';

    for (const [language, keywords] of Object.entries(EMERGENCY_KEYWORDS)) {
      for (const { word, weight } of keywords) {
        if (lower.includes(word) && weight > keywordScore) {
          keywordScore = weight;
          keywordMatch = word;
          keywordLanguage = language;
        }
      }
    }

    // ── 3. Context co-occurrence boost ──────────────────────
    const words = lower.split(/\s+/);
    const contextMatches = DISTRESS_CONTEXT.filter(w => words.includes(w));
    const contextBoost = Math.min(contextMatches.length * 0.12, 0.25);

    // ── 4. Repetition boost ─────────────────────────────────
    this.recentTranscripts.push(lower);
    if (this.recentTranscripts.length > 5) this.recentTranscripts.shift();
    const recentDistressCount = this.recentTranscripts.filter(t => {
      const v = this.vectorizer.transform(t);
      return this.model.predictProbability(v) >= mlThreshold;
    }).length;
    const repetitionBoost = Math.min((recentDistressCount - 1) * 0.08, 0.16);

    // ── 5. Audio energy boost ───────────────────────────────
    const audioEnergyBoost = audioEnergy > 0.4 ? 0.12 : audioEnergy > 0.2 ? 0.06 : 0;

    // ── 6. Combined final score ─────────────────────────────
    // Weight: 40% keyword, 40% ML, 20% contextual signals
    const rawScore =
      keywordScore * 0.40 +
      mlProbability * 0.40 +
      contextBoost +
      repetitionBoost +
      audioEnergyBoost;
    const finalScore = Math.min(rawScore, 1.0);

    // ── 7. Hybrid trigger logic from the paper ──────────────
    // Trigger = KeywordMatch ∨ (P(y=1|x) ≥ τ)
    const keywordTriggered = keywordScore >= 0.7;
    const mlTriggered = mlProbability >= mlThreshold;

    let triggerSource: ClassificationResult['triggerSource'] = 'none';
    let isDistress = false;

    if (keywordTriggered && mlTriggered) {
      triggerSource = 'hybrid';
      isDistress = true;
    } else if (keywordTriggered) {
      triggerSource = 'keyword';
      isDistress = true;
    } else if (mlTriggered) {
      triggerSource = 'ml';
      isDistress = true;
    }

    return {
      isDistress,
      mlProbability,
      keywordScore,
      keywordMatch,
      keywordLanguage,
      contextBoost,
      repetitionBoost,
      audioEnergyBoost,
      finalScore,
      triggerSource,
    };
  }

  /** Reset recent transcript history */
  resetHistory(): void {
    this.recentTranscripts = [];
  }

  get isReady(): boolean {
    return this.ready;
  }

  private emptyResult(): ClassificationResult {
    return {
      isDistress: false, mlProbability: 0, keywordScore: 0,
      keywordMatch: '', keywordLanguage: '', contextBoost: 0,
      repetitionBoost: 0, audioEnergyBoost: 0, finalScore: 0,
      triggerSource: 'none',
    };
  }
}

/** Singleton instance — trains once on first import */
let _instance: DistressClassifier | null = null;

export function getDistressClassifier(): DistressClassifier {
  if (!_instance) {
    _instance = new DistressClassifier();
    _instance.train();
  }
  return _instance;
}
