import { Mic, MicOff } from 'lucide-react';

interface SOSButtonProps {
  onTrigger: () => void;
  isActive: boolean;
}

const SOSButton = ({ onTrigger, isActive }: SOSButtonProps) => {
  return (
    <div className="relative">
      {/* Ripple rings */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full bg-emergency/20 animate-ripple" />
          <div className="absolute inset-0 rounded-full bg-emergency/10 animate-ripple" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      <button
        onClick={onTrigger}
        className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center font-bold text-3xl tracking-wider transition-all duration-300 ${
          isActive
            ? 'bg-gradient-emergency shadow-glow scale-110 text-emergency-foreground'
            : 'bg-gradient-emergency shadow-emergency hover:scale-105 active:scale-95 text-emergency-foreground'
        }`}
      >
        <span className="text-4xl font-black">SOS</span>
        {isActive ? (
          <Mic className="w-5 h-5 mt-1 animate-pulse" />
        ) : (
          <MicOff className="w-5 h-5 mt-1 opacity-60" />
        )}
      </button>
    </div>
  );
};

export default SOSButton;
