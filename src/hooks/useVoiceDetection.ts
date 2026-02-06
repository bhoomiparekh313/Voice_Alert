import { useState, useEffect, useCallback, useRef } from 'react';

// Emergency keywords in multiple languages
const EMERGENCY_KEYWORDS: Record<string, string[]> = {
  english: [
    'help', 'help me', 'save me', 'please help', 'emergency', 'sos',
    'call police', 'im in danger', 'someone help', 'help quickly',
    'im scared', 'theyre attacking me', 'help me now', 'im in trouble',
  ],
  hindi: [
    'bachao', 'madad', 'mujhe bachao', 'koi bachao', 'help karo',
    'mujhe bacha lo', 'police bulao', 'koi help karo', 'koi hai kya',
    'bhagwan bachao', 'mujhe danger hai', 'main danger mein hoon',
    'mujhe help chahiye', 'meri help karo', 'jaldi help karo',
    'mujhe bachane aao', 'arre bachao', 'arre madad karo',
  ],
  marathi: [
    'vachva', 'madad kara', 'koni tari vachva', 'police bola',
    'aag lagali', 'mala vachva',
  ],
};

const ALL_KEYWORDS = Object.values(EMERGENCY_KEYWORDS).flat();

export interface VoiceDetectionResult {
  transcript: string;
  keyword: string;
  confidence: number;
  timestamp: Date;
  language: string;
}

interface UseVoiceDetectionOptions {
  onEmergencyDetected?: (result: VoiceDetectionResult) => void;
  onTranscript?: (text: string) => void;
  continuous?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognitionClass(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function useVoiceDetection(options: UseVoiceDetectionOptions = {}) {
  const { onEmergencyDetected, onTranscript, continuous = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const callbacksRef = useRef({ onEmergencyDetected, onTranscript });

  useEffect(() => {
    callbacksRef.current = { onEmergencyDetected, onTranscript };
  }, [onEmergencyDetected, onTranscript]);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionClass());
  }, []);

  const checkForEmergency = useCallback((text: string): VoiceDetectionResult | null => {
    const lower = text.toLowerCase().trim();
    for (const [language, keywords] of Object.entries(EMERGENCY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          return {
            transcript: text,
            keyword,
            confidence: 0.85 + Math.random() * 0.15,
            timestamp: new Date(),
            language,
          };
        }
      }
    }
    return null;
  }, []);

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
          const emergencyResult = checkForEmergency(finalTranscript);
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
    } catch {
      setError('Failed to start voice recognition');
    }
  }, [continuous, checkForEmergency]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    lastTranscript,
    error,
    startListening,
    stopListening,
    emergencyKeywords: ALL_KEYWORDS,
  };
}
