import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useTest } from "@/context/test-context";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/ui/timer";
import { AudioPlayer } from "@/components/ui/audio-player";
import { TranscriptionArea } from "@/components/ui/transcription-area";
import { ResultsCard } from "@/components/ui/results-card";
import { FinalResults } from "@/components/ui/final-results";
import { calculateWordAccuracy } from "@/lib/utils/levenshtein";
import { LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TranscriptionTest: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const {
    isTestActive,
    isTestComplete,
    currentSampleIndex,
    totalSamples,
    currentSample,
    results,
    avgAccuracy,
    avgWpm,
    startTest,
    submitTranscription,
    moveToNextSample,
    restartTest,
    isLoading,
  } = useTest();

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showResultsCard, setShowResultsCard] = useState(false);
  const [resetTextArea, setResetTextArea] = useState(false);
  const [resetTimer, setResetTimer] = useState(false);
  
  // Current result calculation
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [timeTaken, setTimeTaken] = useState(0);
  const initialTimeRef = useRef(120); // 2 minutes default

  const [wordAccuracy, setWordAccuracy] = useState({
    correctWords: 0,
    totalWords: 0,
    accuracy: 0,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Start the test when the component mounts if not already started
  useEffect(() => {
    if (user && !isTestActive && !isTestComplete && !isLoading) {
      startTest();
    }
  }, [user, isTestActive, isTestComplete, isLoading, startTest]);

  // Set initial timer based on audio duration
  useEffect(() => {
    if (currentSample) {
      // Set timer to 2x the audio duration (minimum 60 seconds)
      const timerSeconds = Math.max(60, currentSample.duration * 2);
      initialTimeRef.current = timerSeconds;
    }
  }, [currentSample]);

  // Handle audio playback controls
  const handlePlay = () => {
    setIsPlaying(true);
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    // Don't restart the timer, just the audio
  };

  // Handle timer events
  const handleTimeUp = () => {
    if (currentTranscription.trim()) {
      handleSubmit(currentTranscription);
    } else {
      toast({
        title: "Time's up!",
        description: "You didn't enter any text. Please try again with the next sample.",
        variant: "destructive",
      });
      moveToNextSample();
      resetForNextSample();
    }
  };

  const handleTimerTick = (timeLeft: number) => {
    setTimeTaken(initialTimeRef.current - timeLeft);
  };

  // Handle text input
  const handleTextChange = (text: string) => {
    setCurrentTranscription(text);
  };

  // Handle submission
  const handleSubmit = (text: string) => {
    if (!currentSample) return;
    
    const submittedText = text.trim();
    // Calculate word accuracy for display
    const wordAccuracyResult = calculateWordAccuracy(submittedText, currentSample.transcript);
    setWordAccuracy(wordAccuracyResult);
    
    // Use actual time taken or default to initialTime if submitted early
    const actualTimeTaken = timeTaken > 0 ? timeTaken : initialTimeRef.current;
    
    // Submit to context
    submitTranscription(submittedText, actualTimeTaken);
    
    // Stop timer and show results
    setIsTimerRunning(false);
    setShowResultsCard(true);
  };

  // Handle next sample
  const handleNextSample = () => {
    moveToNextSample();
    resetForNextSample();
  };

  // Reset states for next sample
  const resetForNextSample = () => {
    setIsPlaying(false);
    setIsTimerRunning(false);
    setShowResultsCard(false);
    setCurrentTranscription("");
    setTimeTaken(0);
    
    // Reset the textarea and timer
    setResetTextArea(prev => !prev);
    setResetTimer(prev => !prev);
  };

  // Handle test restart
  const handleRestartTest = () => {
    restartTest();
    resetForNextSample();
  };

  // Switch to admin view
  const handleAdminView = () => {
    if (isAdmin) {
      setLocation("/admin");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Loading test...</p>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Navigation Bar */}
      <nav className="bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-medium text-lg">Audio Transcription Tool</span>
            </div>
            <div className="flex items-center">
              <span className="text-white mr-2">{user?.name || "Guest"}</span>
              <Button 
                variant="outline"
                size="sm"
                onClick={logout} 
                className="text-white bg-primary-dark px-3 py-1 rounded hover:bg-opacity-80"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs Navigation */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex border-b">
            <button className="px-6 py-3 border-b-2 border-primary text-primary font-medium text-sm focus:outline-none">
              Transcription Test
            </button>
            {isAdmin && (
              <button 
                className="px-6 py-3 text-muted-foreground font-medium text-sm hover:text-primary focus:outline-none"
                onClick={handleAdminView}
              >
                Admin Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {isTestActive && !isTestComplete && (
          <div>
            {/* Progress Indicator */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg font-medium mr-2">Progress:</span>
                <span className="font-bold text-primary">{currentSampleIndex + 1}</span>
                <span className="mx-1">of</span>
                <span>{totalSamples}</span>
              </div>
              <div className="inline-flex rounded-md shadow-sm">
                <Button 
                  variant="outline"
                  onClick={handleNextSample}
                  disabled={showResultsCard}
                  className="py-2 px-4 text-sm text-muted-foreground"
                >
                  Skip to Next Sample
                </Button>
              </div>
            </div>

            {/* Audio Player */}
            {currentSample && (
              <AudioPlayer
                src={currentSample.path}
                onPlay={handlePlay}
                onPause={handlePause}
                onRestart={handleRestart}
              />
            )}

            {/* Timer and Transcription Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Timer Card */}
              <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-center h-64 lg:col-span-1">
                <Timer
                  initialTime={initialTimeRef.current}
                  onTimeUp={handleTimeUp}
                  isRunning={isTimerRunning}
                  onTick={handleTimerTick}
                  reset={resetTimer}
                />
              </div>

              {/* Transcription Area */}
              <div className="lg:col-span-3">
                <TranscriptionArea
                  onSubmit={handleSubmit}
                  isDisabled={showResultsCard}
                  onChange={handleTextChange}
                  reset={resetTextArea}
                />
              </div>
            </div>

            {/* Results Card - Shows after submission */}
            {showResultsCard && results.length > 0 && (
              <ResultsCard
                accuracy={results[results.length - 1].accuracy}
                wpm={results[results.length - 1].wpm}
                correctWords={wordAccuracy.correctWords}
                totalWords={wordAccuracy.totalWords}
                onNext={handleNextSample}
              />
            )}
          </div>
        )}

        {/* Final Results - Shows after test completion */}
        {isTestComplete && (
          <FinalResults
            results={results.map(r => ({
              sampleId: r.sampleId,
              sampleTitle: r.sampleTitle,
              accuracy: r.accuracy,
              wpm: r.wpm,
              timeTaken: r.timeTaken,
            }))}
            avgAccuracy={avgAccuracy}
            avgWpm={avgWpm}
            onRestart={handleRestartTest}
          />
        )}
      </main>
    </div>
  );
};

export default TranscriptionTest;
