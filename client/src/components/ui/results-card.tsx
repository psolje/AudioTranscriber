import React from "react";
import { Button } from "./button";
import { CircularProgress } from "./circular-progress";

interface ResultCardProps {
  accuracy: number;
  wpm: number;
  correctWords: number;
  totalWords: number;
  onNext: () => void;
}

export const ResultsCard: React.FC<ResultCardProps> = ({
  accuracy,
  wpm,
  correctWords,
  totalWords,
  onNext,
}) => {
  // Calculate the progress bar width for WPM (max realistic WPM is 100)
  const wpmPercentage = Math.min(wpm / 100 * 100, 100);
  
  // Determine color based on accuracy
  const getAccuracyColor = (acc: number): string => {
    if (acc >= 90) return "hsl(var(--success))";
    if (acc >= 75) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };
  
  const accuracyColor = getAccuracyColor(accuracy);

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-xl font-medium text-center">Transcription Results</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accuracy Metric */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Accuracy</h3>
          <div className="flex items-center justify-between">
            <div className="relative w-20 h-20">
              <CircularProgress
                value={accuracy}
                size={80}
                strokeWidth={8}
                color={accuracyColor}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color: accuracyColor }}>
                  {accuracy}%
                </span>
              </div>
            </div>
            
            <div className="ml-4">
              <div className="mb-2">
                <span className="text-sm text-muted-foreground">Correct Words:</span>
                <span className="ml-1 font-medium">{correctWords}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Words:</span>
                <span className="ml-1 font-medium">{totalWords}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* WPM Metric */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Typing Speed</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-primary">{wpm}</div>
            <div className="ml-2 text-muted-foreground">WPM</div>
          </div>
          
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${wpmPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>0 WPM</span>
              <span>50 WPM</span>
              <span>100 WPM</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button 
          onClick={onNext}
          className="py-2 px-6 bg-primary hover:bg-primary-dark"
        >
          Next Audio Sample
        </Button>
      </div>
    </div>
  );
};

export default ResultsCard;
