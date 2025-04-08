import React, { useState, useEffect, useCallback } from "react";
import { CircularProgress } from "./circular-progress";

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  isRunning: boolean;
  onTick?: (timeLeft: number) => void;
  reset?: boolean;
  onReset?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  onTimeUp,
  isRunning,
  onTick,
  reset,
  onReset
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [status, setStatus] = useState<string>("Transcribe the audio");

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const updateTimer = useCallback(() => {
    setTimeLeft((prevTime) => {
      const newTime = prevTime - 1;
      
      // Update status message based on time left
      if (newTime <= 30 && newTime > 10) {
        setStatus("Hurry up!");
      } else if (newTime <= 10 && newTime > 0) {
        setStatus("Almost out of time!");
      } else if (newTime <= 0) {
        setStatus("Time's up!");
        onTimeUp();
        return 0;
      }
      
      if (onTick) {
        onTick(newTime);
      }
      
      return newTime;
    });
  }, [onTimeUp, onTick]);

  // Reset timer when reset prop changes
  useEffect(() => {
    if (reset) {
      setTimeLeft(initialTime);
      setStatus("Transcribe the audio");
      if (onReset) {
        onReset();
      }
    }
  }, [reset, initialTime, onReset]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(updateTimer, 1000);
    } else if (timeLeft === 0) {
      setStatus("Time's up!");
      if (interval) clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, updateTimer]);

  // Calculate progress percentage
  const progress = (timeLeft / initialTime) * 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-lg font-medium mb-2">Time Remaining</h2>
      
      <div className="relative w-32 h-32 my-2">
        <CircularProgress 
          value={progress} 
          size={128} 
          strokeWidth={8}
          // Change color to warning or error as time decreases
          color={timeLeft > 30 ? "hsl(var(--primary))" : timeLeft > 10 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold" 
                style={{ 
                  color: timeLeft > 30 ? "hsl(var(--primary))" : 
                         timeLeft > 10 ? "hsl(var(--warning))" : 
                         "hsl(var(--destructive))" 
                }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      
      <div className="text-center mt-2">
        <span className="text-sm text-muted-foreground">{status}</span>
      </div>
    </div>
  );
};

export default Timer;
