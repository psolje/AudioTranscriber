import React, { useRef, useEffect, useState } from "react";
import { FileMusic, AlertCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [formattedSrc, setFormattedSrc] = useState("");
  
  // Format the source URL properly to ensure it loads correctly
  const getFormattedSrc = (source: string) => {
    // If it's already a complete URL, return as is
    if (source.startsWith('http')) return source;
    
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
    
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      if (audio.error) {
        console.error("Audio error code:", audio.error.code);
        console.error("Audio error message:", audio.error.message);
      }
      setError("Unable to play audio. This file may be corrupted or in an unsupported format.");
    };
    
    const handleCanPlay = () => {
      console.log("Audio can play now");
      setError(null);
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
      {!error ? (
        <audio
          ref={audioRef}
          src={formattedSrc}
          controls
          preload="auto"
          className="w-full"
        />
      ) : (
        <div className="w-full p-3 border rounded-md bg-red-50 text-red-500 flex items-center mb-3">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Direct link fallback */}
      <div className="mt-2">
        <a href={formattedSrc} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
          Try direct download/play in new tab
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
