import React, { useRef, useState, useEffect } from "react";
import { Button } from "./button";
import { Slider } from "./slider";
import { Play, Pause, RotateCcw, Volume2, Loader2, FileMusic } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Calculate progress percentage
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  // Format the source URL properly to ensure it loads correctly
  const getFormattedSrc = () => {
    // If it's already a complete URL, return as is
    if (src.startsWith('http')) return src;
    
    // If it starts with a slash, assume it's relative to the origin
    if (src.startsWith('/')) return `${window.location.origin}${src}`;
    
    // Otherwise, make it relative to the current path
    return `${window.location.origin}/${src}`;
  };

  // Load audio and setup event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setLoading(true);
    setError(null);

    // Use a formatted source URL
    const formattedSrc = getFormattedSrc();
    audio.src = formattedSrc;
    
    console.log("Loading audio from:", formattedSrc);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
      console.log("Audio metadata loaded, duration:", audio.duration);
    };

    const handleLoadedData = () => {
      setLoading(false);
      console.log("Audio data loaded");
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onPause();
    };

    const handleError = (e: Event) => {
      setLoading(false);
      const errorMessage = "Failed to load audio file. Please check the file path and format.";
      setError(errorMessage);
      console.error("Audio error:", e, audio.error);
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Set initial volume
    audio.volume = volume / 100;

    // Preload the audio
    audio.load();

    // Add a timeout to handle cases where the audio never loads
    const loadTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("Audio file took too long to load. Please check the connection and try again.");
      }
    }, 10000); // 10 seconds timeout

    // Autoplay if set and after a short delay to ensure loading
    let autoplayTimer: number | undefined;
    if (autoPlay) {
      autoplayTimer = window.setTimeout(() => {
        playAudio();
      }, 500);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      
      clearTimeout(loadTimeout);
      if (autoplayTimer) clearTimeout(autoplayTimer);
    };
  }, [src, autoPlay, onPlay, onPause]);

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Use browser's native play API with proper error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          onPlay();
        })
        .catch((error) => {
          console.error("Play failed:", error);
          setError("Failed to play audio. Please try again.");
          setIsPlaying(false);
        });
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || loading) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPause();
    } else {
      playAudio();
    }
  };

  const restartAudio = () => {
    const audio = audioRef.current;
    if (!audio || loading) return;

    audio.currentTime = 0;
    if (!isPlaying) {
      playAudio();
    }
    onRestart();
  };

  const handleProgressChange = (newValue: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (newValue[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const adjustVolume = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Audio Sample</h2>
      
      {/* Audio Visualizer/Waveform */}
      <div className="relative w-full h-16 bg-neutral-100 rounded-md mb-4 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div 
              className="absolute h-full bg-primary/20 rounded-md"
              style={{ width: `${progress}%` }}
            ></div>
            
            {/* Audio Visualization */}
            <div className="absolute inset-0 flex items-center justify-center px-4">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 mx-0.5 rounded-full bg-primary transition-all duration-150",
                    isPlaying 
                      ? "animate-pulse" 
                      : "opacity-40"
                  )}
                  style={{ 
                    height: `${isPlaying 
                      ? 20 + Math.sin(i * 0.5) * 20 
                      : 10}px`,
                    animationDelay: `${i * 30}ms`
                  }}
                ></div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Progress Slider */}
      <Slider
        value={[progress]}
        min={0}
        max={100}
        step={0.1}
        className="w-full mb-4"
        onValueChange={handleProgressChange}
        disabled={loading || !!error}
      />
      
      {/* Audio Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="default"
            size="icon"
            className="rounded-full w-12 h-12 bg-primary hover:bg-primary-dark"
            onClick={togglePlayPause}
            disabled={loading || !!error}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:text-primary-dark hover:bg-transparent"
            onClick={restartAudio}
            disabled={loading || !!error}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Volume2 className="text-muted-foreground h-5 w-5" />
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            className="w-24"
            onValueChange={adjustVolume}
            disabled={loading || !!error}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{formatTime(currentTime)}</span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Audio Element - we don't set src here as it's set in the useEffect */}
      <audio
        ref={audioRef}
        preload="auto"
        controls={false}
      />
      
      {/* Fallback Native Audio Player (shown when there's an error) */}
      {error && (
        <div className="mt-4 border rounded-lg p-4 bg-slate-50">
          <div className="flex items-center space-x-2 mb-2">
            <FileMusic className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Fallback Audio Player</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Our custom player encountered an issue. Use this standard audio player instead:
          </p>
          <audio 
            src={getFormattedSrc()} 
            controls 
            className="w-full"
            onPlay={() => onPlay()}
            onPause={() => onPause()}
          />
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
