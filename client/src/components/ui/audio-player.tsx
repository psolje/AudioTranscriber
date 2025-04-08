import React, { useRef, useEffect } from "react";
import { FileMusic } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  // Format the source URL properly to ensure it loads correctly
  const getFormattedSrc = () => {
    // If it's already a complete URL, return as is
    if (src.startsWith('http')) return src;
    
    // If it starts with a slash, use it as-is (relative to root)
    if (src.startsWith('/')) return src;
    
    // Otherwise, add a leading slash
    return `/${src}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      onPlay();
    };

    const handlePause = () => {
      onPause();
    };

    const handleEnded = () => {
      onPause();
    };

    // Add event listeners
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
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [autoPlay, onPlay, onPause, onRestart]);

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
      
      {/* Native Audio Element with controls */}
      <audio
        ref={audioRef}
        src={getFormattedSrc()}
        controls
        preload="auto"
        className="w-full"
      />
      
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
