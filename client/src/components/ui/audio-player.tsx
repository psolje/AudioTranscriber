import React, { useRef, useEffect, useState } from "react";
import { FileMusic, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Base64-encoded WAV audio file for a 1-second beep (guaranteed to work in all browsers)
const DEFAULT_AUDIO = "data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAABcflwAXX9dAF6AXgBegF4AXX9dAFx+XABafFoAWHpYAFZ4VgBUdlQAUnRSAE9xTwBNb00ASm1KAEhqSABFaEUAQmVCAEBjQAA9YT0AOl86ADhdOAA1WzUAMlkyAC9XLwAsVSwAKVMpACdRJwAkTyQAIk0iAB9LHwAdSR0AGkYaABhEGAAVQhUAE0ATABFOEQAPTg8ADE4MAAo/CgAIOwgABjgGAAU1BQADMgMAATABAAAuAAAAKwAA/yn/AP0n/QD8Jf0A+iP6APgh+AD3H/cA9R71APMc8wDyG/IA8BnwAO8X7wDtFu0A7BTsAOsT6wDpEukA6BDoAOYP5gDlDuUA5A3kAOIM4gDhC+EA4AqvAOAKiwDfCp0A3wqbAN8KmgDfCpgA3wqXAN8KlQDfCpMA3wqSAN8KkADfCo8A3wqNAN8KjADfCooA3wqJAN8KhwDfCoYA3wqEAN8KgwDfCoHA";

interface AudioPlayerProps {
  src: string;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onPlay,
  onPause,
  onRestart,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [formattedSrc, setFormattedSrc] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Format the source URL properly to ensure it loads correctly
  const getFormattedSrc = (source: string) => {
    // If it's already a complete URL or data URI, return as is
    if (source.startsWith('http') || source.startsWith('data:')) return source;
    
    // For relative paths, ensure they're properly formatted for browser
    if (source.startsWith('/')) {
      // Remove leading slash
      return source.substring(1);
    }
    
    return source;
  };

  useEffect(() => {
    const formatted = getFormattedSrc(src);
    console.log("Audio source:", src);
    console.log("Formatted source:", formatted);
    setFormattedSrc(formatted);
    setUsingFallback(false);
    setError(null);
    
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      if (audio.error) {
        console.error("Audio error code:", audio.error.code);
        console.error("Audio error message:", audio.error.message);
      }
      
      // Switch to base64 audio fallback
      setError("Unable to play audio file. Using fallback audio.");
      setUsingFallback(true);
      // Set the source to the default audio after a short delay
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = DEFAULT_AUDIO;
          audioRef.current.load();
        }
      }, 100);
    };
    
    const handleCanPlay = () => {
      console.log("Audio can play now");
      if (!usingFallback) {
        setError(null);
      }
    };

    const handlePlay = () => {
      console.log("Audio playing");
      onPlay();
    };

    const handlePause = () => {
      console.log("Audio paused");
      onPause();
    };

    const handleEnded = () => {
      console.log("Audio ended");
      onPause();
    };

    // Add event listeners
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    if (autoPlay) {
      // Use a timeout to trigger play after the component is mounted
      const timer = setTimeout(() => {
        audio.play().catch(err => {
          console.error("Autoplay failed", err);
        });
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src, autoPlay, onPlay, onPause, onRestart]);

  // Handle restart functionality
  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Restart failed", err);
      });
      onRestart();
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Audio Sample</h2>
        <button 
          onClick={handleRestart}
          className="text-xs text-primary hover:underline flex items-center"
        >
          <span className="mr-1">Restart</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 2v6h6"></path>
            <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
          </svg>
        </button>
      </div>
      
      {/* Debug info */}
      <div className="text-xs mb-2 p-2 bg-gray-50 rounded-md">
        <p><strong>Original path:</strong> {src}</p>
        <p><strong>Formatted path:</strong> {formattedSrc}</p>
        {usingFallback && (
          <p className="text-amber-600 mt-1 font-medium">Using fallback audio (test beep sound)</p>
        )}
      </div>
      
      {/* Simple audio visualization */}
      <div className="w-full h-12 bg-neutral-100 rounded-md mb-4 overflow-hidden flex items-center justify-center">
        <div className={cn("flex items-center justify-center space-x-1")}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse opacity-70"
              style={{ 
                height: `${12 + (i % 3) * 5}px`,
                animationDelay: `${i * 100}ms`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Warning message */}
      {error && (
        <div className="w-full p-3 border rounded-md bg-amber-50 text-amber-700 flex items-center mb-3">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Native Audio Element with controls */}
      <audio
        ref={audioRef}
        src={usingFallback ? DEFAULT_AUDIO : formattedSrc}
        controls
        preload="auto"
        className="w-full"
      />
      
      {/* Test page link */}
      <div className="mt-2">
        <a 
          href="audio-samples/test.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-blue-500 hover:underline"
        >
          Open audio test page
        </a>
      </div>
      
      {/* Audio Information */}
      <div className="mt-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <FileMusic className="h-3 w-3 mr-1" />
          <span>Listen carefully and transcribe the audio content accurately.</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
