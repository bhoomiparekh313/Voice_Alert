import { useState, useEffect, useCallback, useRef } from 'react';
import { getDistressClassifier, ALL_KEYWORDS, type ClassificationResult } from '@/lib/ml/distress-classifier';

export interface VoiceDetectionResult {
  transcript: string;
  keyword: string;
  confidence: number;
  timestamp: Date;
  language: string;
  triggerSource: 'keyword' | 'ml' | 'hybrid' | 'none';
  mlProbability: number;
  analysisDetails: ClassificationResult;
}

interface UseVoiceDetectionOptions {
  onEmergencyDetected?: (result: VoiceDetectionResult) => void;
  onTranscript?: (text: string) => void;
  continuous?: boolean;
  sensitivityThreshold?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognitionClass(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'language-not-supported']);
const MAX_RAPID_ENDS = 5;
const RAPID_END_WINDOW_MS = 3000;

export function useVoiceDetection(options: UseVoiceDetectionOptions = {}) {
  const {
    onEmergencyDetected,
    onTranscript,
    continuous = true,
    sensitivityThreshold = 0.60,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [mlReady, setMlReady] = useState(false);

  const recognitionRef = useRef<any>(null);
  const callbacksRef = useRef({ onEmergencyDetected, onTranscript });

  // State machine refs
  const shouldRestartRef = useRef(false);
  const isManuallyStoppingRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rapidEndTimestampsRef = useRef<number[]>([]);
  const fatalErrorRef = useRef(false);
  const isActiveRef = useRef(false); // guards duplicate start()

  const classifierRef = useRef(getDistressClassifier());

  useEffect(() => {
    callbacksRef.current = { onEmergencyDetected, onTranscript };
  }, [onEmergencyDetected, onTranscript]);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionClass());
    setMlReady(classifierRef.current.isReady);
  }, []);

  // ── Hybrid analysis (unchanged ML pipeline) ────────────────
  const analyzeTranscript = useCallback((text: string): VoiceDetectionResult | null => {
    const classifier = classifierRef.current;
    if (!classifier.isReady) return null;

    const result = classifier.classify(text, {
      mlThreshold: sensitivityThreshold,
      audioEnergy: 0, // audio energy disabled to avoid mic contention
    });

    setCurrentConfidence(result.finalScore);

    if (result.isDistress) {
      return {
        transcript: text,
        keyword: result.keywordMatch || `ML(${(result.mlProbability * 100).toFixed(0)}%)`,
        confidence: result.finalScore,
        timestamp: new Date(),
        language: result.keywordLanguage || 'detected',
        triggerSource: result.triggerSource,
        mlProbability: result.mlProbability,
        analysisDetails: result,
      };
    }
    return null;
  }, [sensitivityThreshold]);

  // ── Controlled restart with backoff ────────────────────────
  const scheduleRestart = useCallback((recognition: any) => {
    if (isManuallyStoppingRef.current || fatalErrorRef.current) return;
    if (!shouldRestartRef.current) return;

    // Circuit breaker: check for rapid-end storm
    const now = Date.now();
    rapidEndTimestampsRef.current.push(now);
    // Keep only timestamps within the window
    rapidEndTimestampsRef.current = rapidEndTimestampsRef.current.filter(
      ts => now - ts < RAPID_END_WINDOW_MS
    );

    if (rapidEndTimestampsRef.current.length >= MAX_RAPID_ENDS) {
      console.error('[VANI] Circuit breaker: too many rapid restarts, stopping.');
      setError('Voice recognition keeps restarting. Please try again in a moment.');
      setIsListening(false);
      setIsStarting(false);
      shouldRestartRef.current = false;
      isActiveRef.current = false;
      return;
    }

    // Backoff delay: 300ms base + 200ms per recent rapid end
    const delay = 300 + rapidEndTimestampsRef.current.length * 200;
    console.log(`[VANI] Scheduling restart in ${delay}ms`);

    restartTimeoutRef.current = setTimeout(() => {
      if (!shouldRestartRef.current || isManuallyStoppingRef.current) return;
      try {
        recognition.start();
        console.log('[VANI] Restarted recognition');
      } catch (e) {
        console.error('[VANI] Failed to restart:', e);
        setIsListening(false);
        setIsStarting(false);
        isActiveRef.current = false;
      }
    }, delay);
  }, []);

  // ── Start listening ────────────────────────────────────────
  const startListening = useCallback(() => {
    // Guard: prevent duplicate starts
    if (isActiveRef.current) {
      console.log('[VANI] Already active, ignoring start');
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Reset state
    fatalErrorRef.current = false;
    isManuallyStoppingRef.current = false;
    shouldRestartRef.current = continuous;
    rapidEndTimestampsRef.current = [];
    isActiveRef.current = true;
    setError(null);
    setIsStarting(true);

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        console.log('[VANI] Speech recognition started');
        setIsListening(true);
        setIsStarting(false);
        setError(null);
      };

      recognition.onaudiostart = () => {
        console.log('[VANI] Audio capture started');
      };

      recognition.onspeechstart = () => {
        console.log('[VANI] Speech detected');
        // Reset rapid-end counter on actual speech
        rapidEndTimestampsRef.current = [];
      };

      recognition.onspeechend = () => {
        console.log('[VANI] Speech ended');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          if (result.isFinal) {
            finalTranscript += transcript;
            console.log(`[VANI] Final: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setLastTranscript(currentText);
        callbacksRef.current.onTranscript?.(currentText);

        if (finalTranscript) {
          const emergencyResult = analyzeTranscript(finalTranscript);
          console.log('[VANI] Analysis:', emergencyResult ? 'DISTRESS DETECTED' : 'no distress');
          if (emergencyResult) {
            callbacksRef.current.onEmergencyDetected?.(emergencyResult);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error as string;
        console.warn(`[VANI] Error: ${err}`, event.message || '');

        if (FATAL_ERRORS.has(err)) {
          fatalErrorRef.current = true;
          shouldRestartRef.current = false;
          isActiveRef.current = false;
          setIsListening(false);
          setIsStarting(false);

          if (err === 'not-allowed') {
            setError('Microphone access denied. Please allow mic permission and try again.');
          } else {
            setError(`Voice recognition unavailable: ${err}`);
          }
          return;
        }

        if (err === 'no-speech') {
          // Not fatal, recognition will end and we restart
          console.log('[VANI] No speech detected, will restart');
        } else if (err === 'audio-capture') {
          setError('No microphone found. Check your audio device.');
          fatalErrorRef.current = true;
          shouldRestartRef.current = false;
          isActiveRef.current = false;
          setIsListening(false);
          setIsStarting(false);
        } else if (err === 'network') {
          setError('Network error. Speech recognition requires internet.');
        } else if (err !== 'aborted') {
          setError(`Voice recognition error: ${err}`);
        }
      };

      recognition.onend = () => {
        console.log('[VANI] Recognition ended');

        if (isManuallyStoppingRef.current || fatalErrorRef.current) {
          setIsListening(false);
          setIsStarting(false);
          isActiveRef.current = false;
          return;
        }

        if (continuous && shouldRestartRef.current) {
          setIsListening(false); // brief gap
          scheduleRestart(recognition);
        } else {
          setIsListening(false);
          isActiveRef.current = false;
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      console.log('[VANI] Recognition start() called');
    } catch (e) {
      console.error('[VANI] Failed to create recognition:', e);
      setError('Failed to start voice recognition');
      setIsStarting(false);
      isActiveRef.current = false;
    }
  }, [continuous, analyzeTranscript, scheduleRestart]);

  // ── Stop listening ─────────────────────────────────────────
  const stopListening = useCallback(() => {
    console.log('[VANI] Manual stop requested');
    isManuallyStoppingRef.current = true;
    shouldRestartRef.current = false;
    isActiveRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
    setIsStarting(false);
    setCurrentConfidence(0);
    classifierRef.current.resetHistory();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppingRef.current = true;
      shouldRestartRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* */ }
      }
    };
  }, []);

  return {
    isListening,
    isStarting,
    isSupported,
    lastTranscript,
    error,
    currentConfidence,
    mlReady,
    startListening,
    stopListening,
    emergencyKeywords: ALL_KEYWORDS,
  };
}
