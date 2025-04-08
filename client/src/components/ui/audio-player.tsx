import React, { useRef, useState, useEffect } from "react";
import { Button } from "./button";
import { Slider } from "./slider";
import { Waveform } from "./waveform";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";

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

  // Load audio and setup event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onPause();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Set initial volume
    audio.volume = volume / 100;

    // Autoplay if set
    if (autoPlay) {
      audio.play().catch((error) => {
        console.error("Autoplay failed:", error);
      });
      setIsPlaying(true);
      onPlay();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src, autoPlay, onPlay, onPause, volume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      onPause();
    } else {
      audio.play().catch((error) => {
        console.error("Play failed:", error);
      });
      onPlay();
    }
    setIsPlaying(!isPlaying);
  };

  const restartAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    if (!isPlaying) {
      audio.play().catch((error) => {
        console.error("Play failed:", error);
      });
      setIsPlaying(true);
      onPlay();
    }
    onRestart();
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
      
      {/* Waveform Visualization */}
      <Waveform isPlaying={isPlaying} />
      
      {/* Audio Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="default"
            size="icon"
            className="rounded-full w-12 h-12 bg-primary hover:bg-primary-dark"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:text-primary-dark hover:bg-transparent"
            onClick={restartAudio}
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
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{formatTime(currentTime)}</span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} className="hidden" />
    </div>
  );
};

export default AudioPlayer;
