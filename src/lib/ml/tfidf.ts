/**
 * TF-IDF Vectorizer (unigrams + bigrams)
 * Mirrors scikit-learn's TfidfVectorizer behavior as described in the VANI paper.
 */

export class TfIdfVectorizer {
  private vocabulary: Map<string, number> = new Map();
  private idf: Float64Array = new Float64Array(0);
  private fitted = false;

  /** Tokenize into unigrams + bigrams */
  private tokenize(text: string): string[] {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const tokens: string[] = [...words];
    for (let i = 0; i < words.length - 1; i++) {
      tokens.push(`${words[i]} ${words[i + 1]}`);
    }
    return tokens;
  }

  /** Fit on a corpus to learn vocabulary and IDF weights */
  fit(documents: string[]): this {
    const N = documents.length;
    const df = new Map<string, number>();

    // Build vocabulary and document frequencies
    for (const doc of documents) {
      const uniqueTokens = new Set(this.tokenize(doc));
      for (const token of uniqueTokens) {
        df.set(token, (df.get(token) || 0) + 1);
      }
    }

    // Assign indices and compute IDF: log((1+N)/(1+df)) + 1 (smooth IDF)
    let idx = 0;
    this.vocabulary = new Map();
    const idfValues: number[] = [];

    for (const [token, docFreq] of df.entries()) {
      this.vocabulary.set(token, idx++);
      idfValues.push(Math.log((1 + N) / (1 + docFreq)) + 1);
    }

    this.idf = new Float64Array(idfValues);
    this.fitted = true;
    return this;
  }

  /** Transform a single document into a TF-IDF vector (L2-normalized) */
  transform(text: string): Float64Array {
    if (!this.fitted) throw new Error('Vectorizer not fitted');

    const vocabSize = this.vocabulary.size;
    const vec = new Float64Array(vocabSize);
    const tokens = this.tokenize(text);

    // Term frequency
    const tf = new Map<string, number>();
    for (const t of tokens) {
      if (this.vocabulary.has(t)) {
        tf.set(t, (tf.get(t) || 0) + 1);
      }
    }

    // TF * IDF
    for (const [term, freq] of tf.entries()) {
      const idx = this.vocabulary.get(term)!;
      vec[idx] = freq * this.idf[idx];
    }

    // L2 normalization
    let norm = 0;
    for (let i = 0; i < vocabSize; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vocabSize; i++) vec[i] /= norm;
    }

    return vec;
  }

  /** Transform multiple documents */
  transformBatch(documents: string[]): Float64Array[] {
    return documents.map(d => this.transform(d));
  }

  get vocabSize(): number {
    return this.vocabulary.size;
  }

  /** Export model state for serialization */
  exportState(): { vocab: [string, number][]; idf: number[] } {
    return {
      vocab: Array.from(this.vocabulary.entries()),
      idf: Array.from(this.idf),
    };
  }

  /** Import from serialized state */
  importState(state: { vocab: [string, number][]; idf: number[] }): this {
    this.vocabulary = new Map(state.vocab);
    this.idf = new Float64Array(state.idf);
    this.fitted = true;
    return this;
  }
}
