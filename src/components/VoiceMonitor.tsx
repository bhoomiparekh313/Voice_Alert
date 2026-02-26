import { Mic, MicOff, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMonitorProps {
  isListening: boolean;
  isStarting?: boolean;
  isSupported: boolean;
  lastTranscript: string;
  mlReady?: boolean;
  confidence?: number;
  error?: string | null;
  onStart: () => void;
  onStop: () => void;
}

const VoiceMonitor = ({
  isListening,
  isStarting = false,
  isSupported,
  lastTranscript,
  mlReady,
  confidence = 0,
  error,
  onStart,
  onStop,
}: VoiceMonitorProps) => {
  const isActive = isListening || isStarting;

  return (
    <div className="p-6 rounded-xl bg-gradient-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Voice Recognition</h3>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          isListening ? 'bg-safe/15 text-safe' :
          isStarting ? 'bg-warning/15 text-warning' :
          'bg-muted text-muted-foreground'
        }`}>
          {isListening ? 'ACTIVE' : isStarting ? 'STARTING' : 'INACTIVE'}
        </span>
      </div>

      {!isSupported ? (
        <p className="text-sm text-warning">
          ⚠️ Speech recognition is not supported in this browser. Please use Chrome or Edge.
        </p>
      ) : (
        <>
          {/* Error display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="p-4 rounded-lg bg-secondary/50 border border-border min-h-[80px] flex items-center">
            {isListening ? (
              <div className="flex items-start gap-3 w-full">
                <Volume2 className="w-5 h-5 text-safe flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {lastTranscript || 'Listening... Say an emergency keyword'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {mlReady ? '🧠 ML Model: TF-IDF + Logistic Regression active' : '⏳ ML Model loading...'}
                  </p>
                  {confidence > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Distress confidence</span>
                        <span>{(confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            confidence > 0.6 ? 'bg-emergency' : confidence > 0.3 ? 'bg-warning' : 'bg-safe'
                          }`}
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : isStarting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-warning animate-spin" />
                <p className="text-sm text-muted-foreground">Initializing microphone...</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click start to begin voice monitoring
              </p>
            )}
          </div>

          {/* Audio visualizer bars */}
          {isListening && (
            <div className="flex items-end justify-center gap-1 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-emergency/60 rounded-full"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animation: `pulse ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}

          <Button
            onClick={isActive ? onStop : onStart}
            disabled={isStarting}
            variant={isActive ? "destructive" : "default"}
            className={`w-full h-12 font-semibold ${
              !isActive ? 'bg-gradient-emergency text-emergency-foreground shadow-emergency hover:opacity-90' : ''
            }`}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Listening
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground/50 text-center">
            If mic is blocked in embedded preview, open the published URL in a new tab.
          </p>
        </>
      )}
    </div>
  );
};

export default VoiceMonitor;
