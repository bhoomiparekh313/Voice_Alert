/**
 * Logistic Regression classifier
 * P(y=1|x) = σ(w·x + b) = 1 / (1 + e^(-(w·x + b)))
 * Trained via gradient descent on TF-IDF features as per VANI paper.
 */

export class LogisticRegression {
  private weights: Float64Array = new Float64Array(0);
  private bias = 0;
  private trained = false;

  private sigmoid(z: number): number {
    if (z > 500) return 1;
    if (z < -500) return 0;
    return 1 / (1 + Math.exp(-z));
  }

  private dot(a: Float64Array, b: Float64Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  }

  /**
   * Train using mini-batch gradient descent with L2 regularization
   * @param X - array of TF-IDF feature vectors
   * @param y - binary labels (0 or 1)
   */
  fit(
    X: Float64Array[],
    y: number[],
    options: {
      learningRate?: number;
      epochs?: number;
      lambda?: number; // L2 regularization strength
    } = {}
  ): this {
    const { learningRate = 0.5, epochs = 300, lambda = 0.01 } = options;
    const n = X.length;
    const d = X[0].length;

    this.weights = new Float64Array(d);
    this.bias = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = new Float64Array(d);
      let gradB = 0;

      for (let i = 0; i < n; i++) {
        const pred = this.sigmoid(this.dot(this.weights, X[i]) + this.bias);
        const err = pred - y[i];
        for (let j = 0; j < d; j++) {
          gradW[j] += err * X[i][j];
        }
        gradB += err;
      }

      // Update with L2 regularization
      for (let j = 0; j < d; j++) {
        this.weights[j] -= learningRate * (gradW[j] / n + lambda * this.weights[j]);
      }
      this.bias -= learningRate * (gradB / n);
    }

    this.trained = true;
    return this;
  }

  /** Predict distress probability P(y=1|x) */
  predictProbability(x: Float64Array): number {
    if (!this.trained) throw new Error('Model not trained');
    return this.sigmoid(this.dot(this.weights, x) + this.bias);
  }

  /** Predict binary label with threshold */
  predict(x: Float64Array, threshold = 0.5): 0 | 1 {
    return this.predictProbability(x) >= threshold ? 1 : 0;
  }

  /** Export model weights */
  exportState(): { weights: number[]; bias: number } {
    return { weights: Array.from(this.weights), bias: this.bias };
  }

  /** Import pre-trained weights */
  importState(state: { weights: number[]; bias: number }): this {
    this.weights = new Float64Array(state.weights);
    this.bias = state.bias;
    this.trained = true;
    return this;
  }
}
