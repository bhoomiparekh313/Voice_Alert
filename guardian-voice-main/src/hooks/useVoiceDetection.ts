import { useState, useEffect, useCallback, useRef } from 'react';

// Emergency keywords in multiple languages with weights
const EMERGENCY_KEYWORDS: Record<string, { word: string; weight: number }[]> = {
  english: [
    { word: 'help', weight: 0.7 }, { word: 'help me', weight: 0.9 }, { word: 'save me', weight: 0.95 },
    { word: 'please help', weight: 0.9 }, { word: 'emergency', weight: 0.95 }, { word: 'sos', weight: 1.0 },
    { word: 'call police', weight: 1.0 }, { word: 'im in danger', weight: 1.0 }, { word: 'someone help', weight: 0.85 },
    { word: 'help quickly', weight: 0.9 }, { word: 'im scared', weight: 0.6 },
    { word: 'theyre attacking me', weight: 1.0 }, { word: 'help me now', weight: 0.95 },
    { word: 'im in trouble', weight: 0.85 }, { word: 'fire', weight: 0.7 }, { word: 'stop', weight: 0.4 },
    { word: 'leave me alone', weight: 0.8 }, { word: 'get away', weight: 0.75 },
    { word: 'dont touch me', weight: 0.9 }, { word: 'call ambulance', weight: 1.0 },
  ],
  hindi: [
    { word: 'bachao', weight: 0.95 }, { word: 'madad', weight: 0.85 }, { word: 'mujhe bachao', weight: 1.0 },
    { word: 'koi bachao', weight: 0.95 }, { word: 'help karo', weight: 0.85 },
    { word: 'police bulao', weight: 1.0 }, { word: 'koi help karo', weight: 0.85 },
    { word: 'main danger mein hoon', weight: 1.0 }, { word: 'mujhe help chahiye', weight: 0.85 },
    { word: 'jaldi help karo', weight: 0.9 }, { word: 'arre bachao', weight: 0.9 },
    { word: 'chhodo mujhe', weight: 0.85 }, { word: 'mat chuo', weight: 0.9 },
  ],
  marathi: [
    { word: 'vachva', weight: 0.95 }, { word: 'madad kara', weight: 0.85 },
    { word: 'koni tari vachva', weight: 0.95 }, { word: 'police bola', weight: 1.0 },
    { word: 'aag lagali', weight: 0.95 }, { word: 'mala vachva', weight: 0.95 },
  ],
};

const ALL_KEYWORDS = Object.values(EMERGENCY_KEYWORDS).flat().map(k => k.word);

// Distress indicators — contextual words that boost confidence when co-occurring
const DISTRESS_CONTEXT = [
  'please', 'now', 'hurry', 'fast', 'quick', 'scared', 'afraid', 'danger',
  'hurt', 'bleeding', 'attack', 'kill', 'die', 'run', 'escape', 'trapped',
  'jaldi', 'dar', 'daro', 'maro', 'maar',
];

export interface VoiceDetectionResult {
  transcript: string;
  keyword: string;
  confidence: number;
  timestamp: Date;
  language: string;
  analysisDetails: AnalysisDetails;
}

interface AnalysisDetails {
  keywordScore: number;
  contextScore: number;
  repetitionScore: number;
  audioEnergyScore: number;
  finalScore: number;
}

interface UseVoiceDetectionOptions {
  onEmergencyDetected?: (result: VoiceDetectionResult) => void;
  onTranscript?: (text: string) => void;
  continuous?: boolean;
  sensitivityThreshold?: number; // 0-1, default 0.6
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognitionClass(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

/**
 * Enhanced voice detection with multi-signal scoring:
 * 1. Keyword matching with weighted importance
 * 2. Contextual distress word co-occurrence
 * 3. Repetition detection (repeated distress = higher urgency)
 * 4. Audio energy analysis via Web Audio API (loud = higher urgency)
 */
export function useVoiceDetection(options: UseVoiceDetectionOptions = {}) {
  const {
    onEmergencyDetected,
    onTranscript,
    continuous = true,
    sensitivityThreshold = 0.6,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);

  const recognitionRef = useRef<any>(null);
  const callbacksRef = useRef({ onEmergencyDetected, onTranscript });
  const recentTranscriptsRef = useRef<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioEnergyRef = useRef(0);
  const energyFrameRef = useRef<number | null>(null);

  useEffect(() => {
    callbacksRef.current = { onEmergencyDetected, onTranscript };
  }, [onEmergencyDetected, onTranscript]);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionClass());
  }, []);

  // Audio energy monitoring via Web Audio API
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const measureEnergy = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        // RMS energy normalized 0-1
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        audioEnergyRef.current = rms;
        energyFrameRef.current = requestAnimationFrame(measureEnergy);
      };
      measureEnergy();
    } catch {
      // Audio analysis is optional enhancement — silence errors
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (energyFrameRef.current) cancelAnimationFrame(energyFrameRef.current);
    audioContextRef.current?.close();
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current = null;
    analyserRef.current = null;
    audioStreamRef.current = null;
    audioEnergyRef.current = 0;
  }, []);

  // Multi-signal emergency scoring
  const analyzeTranscript = useCallback((text: string): VoiceDetectionResult | null => {
    const lower = text.toLowerCase().trim();
    if (!lower) return null;

    // 1. Keyword matching — find best weighted match
    let bestKeyword = '';
    let keywordScore = 0;
    let matchedLang = 'english';

    for (const [language, keywords] of Object.entries(EMERGENCY_KEYWORDS)) {
      for (const { word, weight } of keywords) {
        if (lower.includes(word) && weight > keywordScore) {
          keywordScore = weight;
          bestKeyword = word;
          matchedLang = language;
        }
      }
    }

    if (keywordScore === 0) return null; // No keyword match at all

    // 2. Context scoring — how many distress context words co-occur
    const words = lower.split(/\s+/);
    const contextMatches = DISTRESS_CONTEXT.filter(w => words.includes(w));
    const contextScore = Math.min(contextMatches.length * 0.15, 0.3); // max 0.3 boost

    // 3. Repetition scoring — emergency keywords repeated in recent history
    recentTranscriptsRef.current.push(lower);
    if (recentTranscriptsRef.current.length > 5) recentTranscriptsRef.current.shift();
    const recentKeywordCount = recentTranscriptsRef.current.filter(t =>
      EMERGENCY_KEYWORDS[matchedLang]?.some(k => t.includes(k.word))
    ).length;
    const repetitionScore = Math.min((recentKeywordCount - 1) * 0.1, 0.2); // max 0.2 boost

    // 4. Audio energy scoring — louder voice = more urgency
    const energy = audioEnergyRef.current;
    const audioEnergyScore = energy > 0.4 ? 0.15 : energy > 0.2 ? 0.08 : 0;

    // Final weighted score
    const finalScore = Math.min(
      keywordScore * 0.55 + contextScore + repetitionScore + audioEnergyScore,
      1.0
    );

    setCurrentConfidence(finalScore);

    if (finalScore >= sensitivityThreshold) {
      return {
        transcript: text,
        keyword: bestKeyword,
        confidence: finalScore,
        timestamp: new Date(),
        language: matchedLang,
        analysisDetails: { keywordScore, contextScore, repetitionScore, audioEnergyScore, finalScore },
      };
    }

    return null;
  }, [sensitivityThreshold]);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setLastTranscript(currentText);
        callbacksRef.current.onTranscript?.(currentText);

        if (finalTranscript) {
          const emergencyResult = analyzeTranscript(finalTranscript);
          if (emergencyResult) {
            callbacksRef.current.onEmergencyDetected?.(emergencyResult);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (continuous && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      startAudioAnalysis();
    } catch {
      setError('Failed to start voice recognition');
    }
  }, [continuous, analyzeTranscript, startAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setCurrentConfidence(0);
    recentTranscriptsRef.current = [];
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  return {
    isListening,
    isSupported,
    lastTranscript,
    error,
    currentConfidence,
    startListening,
    stopListening,
    emergencyKeywords: ALL_KEYWORDS,
  };
}
