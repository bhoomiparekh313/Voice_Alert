import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMonitorProps {
  isListening: boolean;
  isSupported: boolean;
  lastTranscript: string;
  onStart: () => void;
  onStop: () => void;
}

const VoiceMonitor = ({ isListening, isSupported, lastTranscript, onStart, onStop }: VoiceMonitorProps) => {
  return (
    <div className="p-6 rounded-xl bg-gradient-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Voice Recognition</h3>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          isListening ? 'bg-safe/15 text-safe' : 'bg-muted text-muted-foreground'
        }`}>
          {isListening ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {!isSupported ? (
        <p className="text-sm text-warning">
          ⚠️ Speech recognition is not supported in this browser. Please use Chrome or Edge.
        </p>
      ) : (
        <>
          <div className="p-4 rounded-lg bg-secondary/50 border border-border min-h-[80px] flex items-center">
            {isListening ? (
              <div className="flex items-start gap-3 w-full">
                <Volume2 className="w-5 h-5 text-safe flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {lastTranscript || 'Listening... Say an emergency keyword'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Keywords: "help", "bachao", "madad", "save me", "sos"...
                  </p>
                </div>
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
            onClick={isListening ? onStop : onStart}
            variant={isListening ? "destructive" : "default"}
            className={`w-full h-12 font-semibold ${
              !isListening ? 'bg-gradient-emergency text-emergency-foreground shadow-emergency hover:opacity-90' : ''
            }`}
          >
            {isListening ? (
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
        </>
      )}
    </div>
  );
};

export default VoiceMonitor;
