import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { normalizeText, formatTime, getAccuracyColor } from '@/lib/utils';
import { Play, Pause, SkipForward, Clock, Check, X, Award, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AudioSample {
  id: number;
  title: string;
  path: string;
  transcript: string;
  duration: number;
}

interface TestSession {
  id: number;
  userId: number;
  testMode: string;
  sampleIds: number[];
  avgAccuracy?: number;
  avgWpm?: number;
  completed: boolean;
  testDate: string;
}

interface TranscriptionResult {
  userId: number;
  sampleId: number;
  transcription: string;
  accuracy: number;
  wpm: number;
  timeTaken: number;
  testSessionId?: number;
}

const TestPage = () => {
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSample, setCurrentSample] = useState<AudioSample | null>(null);
  const [transcription, setTranscription] = useState('');
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TranscriptionResult[]>([]);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Fetch random audio samples when the component mounts
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await fetch('/api/audio-samples/random?count=3');
        if (response.ok) {
          const data = await response.json();
          setSamples(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch audio samples',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching samples:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch audio samples',
          variant: 'destructive',
        });
      }
    };

    fetchSamples();
  }, [toast]);

  // Set current sample when samples are loaded or index changes
  useEffect(() => {
    if (samples.length > 0 && currentIndex < samples.length) {
      setCurrentSample(samples[currentIndex]);
    }
  }, [samples, currentIndex]);

  // Timer for tracking transcription time
  useEffect(() => {
    if (isStarted && !isComplete && startTimeRef.current !== null) {
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setElapsedTime(elapsedSeconds);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, isComplete]);

  // Handle audio playback control
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle audio events
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);

    return () => {
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
    };
  }, [currentSample]);

  // Calculate Levenshtein distance between two strings (for accuracy)
  const calculateLevenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  };

  // Calculate accuracy percentage
  const calculateAccuracy = (original: string, transcribed: string): number => {
    const normalizedOriginal = normalizeText(original);
    const normalizedTranscribed = normalizeText(transcribed);
    
    if (normalizedOriginal.length === 0) return 0;
    
    const distance = calculateLevenshteinDistance(normalizedOriginal, normalizedTranscribed);
    const accuracy = Math.max(0, 100 - (distance * 100 / normalizedOriginal.length));
    
    return Math.round(accuracy);
  };

  // Calculate words per minute
  const calculateWPM = (text: string, seconds: number): number => {
    const words = normalizeText(text).split(/\s+/).filter(word => word.length > 0);
    const minutes = seconds / 60;
    if (minutes === 0) return 0;
    
    return Math.round(words.length / minutes);
  };

  // Start the test
  const startTest = async () => {
    if (!userName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name to start the test',
        variant: 'destructive',
      });
      return;
    }

    if (!userEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your email to start the test',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create or get user
      const userResponse = await apiRequest('POST', '/api/users', {
        name: userName,
        email: userEmail,
        isAdmin: false,
      });

      if (!userResponse.ok) {
        throw new Error('Failed to create user');
      }

      const user = await userResponse.json();
      setUserId(user.id);

      // Create test session
      const sessionResponse = await apiRequest('POST', '/api/test-sessions', {
        userId: user.id,
        testMode: 'standard',
        sampleIds: samples.map(s => s.id),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create test session');
      }

      const session = await sessionResponse.json();
      setTestSession(session);
      
      setIsStarted(true);
      setCurrentIndex(0);
      setResults([]);
      startTimeRef.current = Date.now();
      
      // Auto-play the audio
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error('Auto-play failed:', e));
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to start the test',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit the current transcription
  const submitTranscription = async () => {
    if (!currentSample || !userId || !testSession) return;

    const timeTaken = elapsedTime;
    const accuracy = calculateAccuracy(currentSample.transcript, transcription);
    const wpm = calculateWPM(transcription, timeTaken);

    const result: TranscriptionResult = {
      userId,
      sampleId: currentSample.id,
      transcription,
      accuracy,
      wpm,
      timeTaken,
      testSessionId: testSession.id,
    };

    try {
      const response = await apiRequest('POST', '/api/transcription-results', result);
      
      if (!response.ok) {
        throw new Error('Failed to submit transcription');
      }

      setResults([...results, result]);
      
      // If this is the last sample, complete the test
      if (currentIndex >= samples.length - 1) {
        completeTest(result);
      } else {
        // Move to the next sample
        setCurrentIndex(prevIndex => prevIndex + 1);
        setTranscription('');
        startTimeRef.current = Date.now();
        setElapsedTime(0);
        
        // Auto-play the next audio after a short delay
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.error('Auto-play failed:', e));
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error submitting transcription:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit transcription',
        variant: 'destructive',
      });
    }
  };

  // Complete the test and calculate final scores
  const completeTest = async (finalResult: TranscriptionResult) => {
    if (!testSession) return;
    
    const allResults = [...results, finalResult];
    const avgAccuracy = Math.round(
      allResults.reduce((sum, r) => sum + r.accuracy, 0) / allResults.length
    );
    const avgWpm = Math.round(
      allResults.reduce((sum, r) => sum + r.wpm, 0) / allResults.length
    );

    try {
      const response = await apiRequest('PATCH', `/api/test-sessions/${testSession.id}`, {
        avgAccuracy,
        avgWpm,
        completed: true,
      });

      if (!response.ok) {
        throw new Error('Failed to complete test session');
      }

      const updatedSession = await response.json();
      setTestSession(updatedSession);
      setIsComplete(true);
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Error completing test:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete the test session',
        variant: 'destructive',
      });
    }
  };

  // Restart the test
  const restartTest = () => {
    setIsStarted(false);
    setIsComplete(false);
    setCurrentIndex(0);
    setTranscription('');
    setResults([]);
    setTestSession(null);
    setElapsedTime(0);
    startTimeRef.current = null;
    
    // Fetch new samples
    const fetchSamples = async () => {
      try {
        const response = await fetch('/api/audio-samples/random?count=3');
        if (response.ok) {
          const data = await response.json();
          setSamples(data);
        }
      } catch (error) {
        console.error('Error fetching samples:', error);
      }
    };
    
    fetchSamples();
  };

  // Render test results
  const renderResults = () => {
    if (!isComplete || !testSession) return null;
    
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl">Test Results</CardTitle>
          <CardDescription>Here's how you performed on this test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Average Accuracy</h3>
              <div className={`text-3xl font-bold ${getAccuracyColor(testSession.avgAccuracy || 0)}`}>
                {testSession.avgAccuracy || 0}%
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Average Speed</h3>
              <div className="text-3xl font-bold text-primary">
                {testSession.avgWpm || 0} <span className="text-sm">WPM</span>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mt-6 mb-2">Sample Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => {
              const sample = samples.find(s => s.id === result.sampleId);
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{sample?.title || `Sample ${index + 1}`}</h4>
                    <Badge 
                      variant={result.accuracy >= 80 ? "default" : "outline"}
                      className={getAccuracyColor(result.accuracy)}
                    >
                      {result.accuracy}% Accuracy
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="inline-flex items-center mr-4">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(result.timeTaken)}
                    </span>
                    <span className="inline-flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {result.wpm} WPM
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Your Transcription:</div>
                    <div className="text-sm bg-muted p-2 rounded">{result.transcription}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={restartTest}>Take Another Test</Button>
        </CardFooter>
      </Card>
    );
  };

  // What to show before test starts
  if (!isStarted) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Test Your Transcription Skills</CardTitle>
            <CardDescription>
              This test will present you with audio samples to transcribe.
              You'll receive accuracy and speed scores to track your performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-name">Your Name</Label>
                <Input
                  id="user-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-email">Email Address</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Test Instructions</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>You will be presented with {samples.length} audio samples to transcribe.</li>
                <li>Listen carefully and type exactly what you hear.</li>
                <li>Your accuracy and typing speed (WPM) will be measured.</li>
                <li>Try to be as accurate as possible while maintaining good speed.</li>
                <li>Use proper punctuation and capitalization as you hear it.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={startTest} 
              disabled={isLoading || samples.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Start Test'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show test results if completed
  if (isComplete) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {renderResults()}
      </div>
    );
  }

  // Main test interface
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              Sample {currentIndex + 1} of {samples.length}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {formatTime(elapsedTime)}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Listen to the audio and transcribe what you hear
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSample ? (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <span className="mr-2">{currentSample.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(currentSample.duration)}
                  </Badge>
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayPause}
                    className="flex items-center"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                  
                  <audio
                    ref={audioRef}
                    src={`/${currentSample.path}`}
                    className="hidden"
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transcription">Your Transcription</Label>
                <Textarea
                  id="transcription"
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="Type what you hear..."
                  className="min-h-[150px]"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading audio sample...</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Try to be as accurate as possible
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={submitTranscription}
              disabled={!transcription.trim()}
            >
              {currentIndex >= samples.length - 1 ? 'Finish Test' : 'Submit & Next'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestPage;