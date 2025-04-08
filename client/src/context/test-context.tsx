import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { calculateLevenshteinAccuracy } from "@/lib/utils/levenshtein";
import { calculateWPM } from "@/lib/utils/wpm-calculator";

interface AudioSample {
  id: number;
  title: string;
  path: string;
  transcript: string;
  duration: number;
}

interface TranscriptionResult {
  sampleId: number;
  sampleTitle: string;
  transcription: string;
  accuracy: number;
  wpm: number;
  timeTaken: number;
}

interface TestContextType {
  // Test configuration
  testMode: "standard" | "extended";
  setTestMode: (mode: "standard" | "extended") => void;
  
  // Test status
  isTestActive: boolean;
  isTestComplete: boolean;
  currentSampleIndex: number;
  totalSamples: number;
  
  // Current sample data
  currentSample: AudioSample | null;
  
  // Results
  results: TranscriptionResult[];
  avgAccuracy: number;
  avgWpm: number;
  
  // Test control functions
  startTest: () => Promise<void>;
  submitTranscription: (text: string, timeTaken: number) => void;
  moveToNextSample: () => void;
  restartTest: () => void;
  
  // Loading states
  isLoading: boolean;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Test configuration
  const [testMode, setTestMode] = useState<"standard" | "extended">("standard");
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  // Test status
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [isTestComplete, setIsTestComplete] = useState<boolean>(false);
  const [currentSampleIndex, setCurrentSampleIndex] = useState<number>(0);
  
  // Sample data
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  
  // Results
  const [results, setResults] = useState<TranscriptionResult[]>([]);
  const [avgAccuracy, setAvgAccuracy] = useState<number>(0);
  const [avgWpm, setAvgWpm] = useState<number>(0);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const totalSamples = testMode === "standard" ? 5 : 10;
  
  // Reset test when user changes
  useEffect(() => {
    if (!user) {
      resetTest();
    }
  }, [user]);
  
  // Reset test state
  const resetTest = () => {
    setSessionId(null);
    setIsTestActive(false);
    setIsTestComplete(false);
    setCurrentSampleIndex(0);
    setSamples([]);
    setCurrentSample(null);
    setResults([]);
    setAvgAccuracy(0);
    setAvgWpm(0);
  };
  
  // Start a new test
  const startTest = async () => {
    if (!user) return;
    
    setIsLoading(true);
    resetTest();
    
    try {
      // Get random audio samples
      const count = testMode === "standard" ? 5 : 10;
      const response = await apiRequest("GET", `/api/audio-samples/random?count=${count}`, undefined);
      const audioSamples = await response.json();
      
      // Create test session
      const sessionResponse = await apiRequest("POST", "/api/test-sessions", {
        userId: user.id,
        testMode: testMode,
        sampleIds: audioSamples.map((s: AudioSample) => s.id),
      });
      const session = await sessionResponse.json();
      
      setSamples(audioSamples);
      setCurrentSample(audioSamples[0]);
      setSessionId(session.id);
      setIsTestActive(true);
      setCurrentSampleIndex(0);
    } catch (error) {
      console.error("Error starting test:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit a transcription for the current sample
  const submitTranscription = async (text: string, timeTaken: number) => {
    if (!user || !currentSample || !sessionId) return;
    
    try {
      // Calculate accuracy and wpm
      const accuracy = calculateLevenshteinAccuracy(text, currentSample.transcript);
      const wpm = calculateWPM(text, timeTaken);
      
      // Save result to server
      await apiRequest("POST", "/api/transcription-results", {
        userId: user.id,
        sampleId: currentSample.id,
        transcription: text,
        accuracy,
        wpm,
        timeTaken,
      });
      
      // Update local results
      const newResult: TranscriptionResult = {
        sampleId: currentSample.id,
        sampleTitle: currentSample.title,
        transcription: text,
        accuracy,
        wpm,
        timeTaken,
      };
      
      const updatedResults = [...results, newResult];
      setResults(updatedResults);
      
      // Calculate averages
      const totalAccuracy = updatedResults.reduce((sum, r) => sum + r.accuracy, 0);
      const totalWpm = updatedResults.reduce((sum, r) => sum + r.wpm, 0);
      const newAvgAccuracy = Math.round(totalAccuracy / updatedResults.length);
      const newAvgWpm = Math.round(totalWpm / updatedResults.length);
      
      setAvgAccuracy(newAvgAccuracy);
      setAvgWpm(newAvgWpm);
      
      // Check if this was the last sample
      const isLastSample = currentSampleIndex === samples.length - 1;
      
      if (isLastSample) {
        // Update session with final results
        await apiRequest("PATCH", `/api/test-sessions/${sessionId}`, {
          avgAccuracy: newAvgAccuracy,
          avgWpm: newAvgWpm,
          completed: true,
        });
        
        setIsTestComplete(true);
      }
    } catch (error) {
      console.error("Error submitting transcription:", error);
    }
  };
  
  // Move to the next sample
  const moveToNextSample = () => {
    if (currentSampleIndex < samples.length - 1) {
      const nextIndex = currentSampleIndex + 1;
      setCurrentSampleIndex(nextIndex);
      setCurrentSample(samples[nextIndex]);
    } else {
      setIsTestComplete(true);
    }
  };
  
  // Restart the test
  const restartTest = () => {
    resetTest();
  };

  return (
    <TestContext.Provider
      value={{
        testMode,
        setTestMode,
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
      }}
    >
      {children}
    </TestContext.Provider>
  );
};

export const useTest = (): TestContextType => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error("useTest must be used within a TestProvider");
  }
  return context;
};
