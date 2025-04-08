import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { AudioSample } from '@shared/schema';
import { Button } from '@/components/ui/button';

const AudioTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  
  // Fetch all available audio samples
  const { data: audioSamples, isLoading } = useQuery<AudioSample[]>({
    queryKey: ['/api/audio-samples'],
  });
  
  const testAudio = (id: number, src: string) => {
    const audio = new Audio(src);
    
    const onCanPlay = () => {
      console.log(`Audio ${id} can play`);
      setTestResults(prev => ({ ...prev, [id]: true }));
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    
    const onError = () => {
      console.error(`Audio ${id} error:`, audio.error);
      setTestResults(prev => ({ ...prev, [id]: false }));
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.load();
  };
  
  const testAllAudio = () => {
    if (!audioSamples) return;
    
    audioSamples.forEach(sample => {
      testAudio(sample.id, sample.path);
    });
  };
  
  // Test the base64 audio
  const testBase64Audio = () => {
    const base64Audio = "data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAABcflwAXX9dAF6AXgBegF4AXX9dAFx+XABafFoAWHpYAFZ4VgBUdlQAUnRSAE9xTwBNb00ASm1KAEhqSABFaEUAQmVCAEBjQAA9YT0AOl86ADhdOAA1WzUAMlkyAC9XLwAsVSwAKVMpACdRJwAkTyQAIk0iAB9LHwAdSR0AGkYaABhEGAAVQhUAE0ATABFOEQAPTg8ADE4MAAo/CgAIOwgABjgGAAU1BQADMgMAATABAAAuAAAAKwAA/yn/AP0n/QD8Jf0A+iP6APgh+AD3H/cA9R71APMc8wDyG/IA8BnwAO8X7wDtFu0A7BTsAOsT6wDpEukA6BDoAOYP5gDlDuUA5A3kAOIM4gDhC+EA4AqvAOAKiwDfCp0A3wqbAN8KmgDfCpgA3wqXAN8KlQDfCpMA3wqSAN8KkADfCo8A3wqNAN8KjADfCooA3wqJAN8KhwDfCoYA3wqEAN8KgwDfCoHA";
    const audio = new Audio(base64Audio);
    
    const onCanPlay = () => {
      console.log(`Base64 audio can play`);
      setTestResults(prev => ({ ...prev, base64: true }));
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    
    const onError = () => {
      console.error(`Base64 audio error:`, audio.error);
      setTestResults(prev => ({ ...prev, base64: false }));
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.load();
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Audio Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-4">
                This page tests if your browser can correctly play the audio files used in the transcription tool.
                Click the buttons below to test.
              </p>
              
              <div className="flex space-x-4 mb-8">
                <Button onClick={testAllAudio}>Test All Audio Files</Button>
                <Button variant="outline" onClick={testBase64Audio}>Test Base64 Audio</Button>
              </div>
              
              <h3 className="text-lg font-medium mb-2">Base64 Audio Fallback</h3>
              <div className="mb-4 p-3 rounded-md border border-gray-200">
                <audio 
                  controls 
                  src="data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAABcflwAXX9dAF6AXgBegF4AXX9dAFx+XABafFoAWHpYAFZ4VgBUdlQAUnRSAE9xTwBNb00ASm1KAEhqSABFaEUAQmVCAEBjQAA9YT0AOl86ADhdOAA1WzUAMlkyAC9XLwAsVSwAKVMpACdRJwAkTyQAIk0iAB9LHwAdSR0AGkYaABhEGAAVQhUAE0ATABFOEQAPTg8ADE4MAAo/CgAIOwgABjgGAAU1BQADMgMAATABAAAuAAAAKwAA/yn/AP0n/QD8Jf0A+iP6APgh+AD3H/cA9R71APMc8wDyG/IA8BnwAO8X7wDtFu0A7BTsAOsT6wDpEukA6BDoAOYP5gDlDuUA5A3kAOIM4gDhC+EA4AqvAOAKiwDfCp0A3wqbAN8KmgDfCpgA3wqXAN8KlQDfCpMA3wqSAN8KkADfCo8A3wqNAN8KjADfCooA3wqJAN8KhwDfCoYA3wqEAN8KgwDfCoHA" 
                />
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs">
                    Status: {typeof testResults.base64 !== 'undefined' ? 
                      (testResults.base64 ? '✅ Working' : '❌ Failed') : 
                      'Not tested'}
                  </span>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Audio Samples Test Results</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audioSamples?.map(sample => (
                  <div key={sample.id} className="p-3 rounded-md border border-gray-200">
                    <h4 className="font-medium mb-2">{sample.title}</h4>
                    <audio controls src={sample.path} />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{sample.path}</span>
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs">
                        Status: {typeof testResults[sample.id] !== 'undefined' ? 
                          (testResults[sample.id] ? '✅ Working' : '❌ Failed') : 
                          'Not tested'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 text-sm text-muted-foreground bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Audio Troubleshooting Tips:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Make sure your browser supports MP3 audio files</li>
                <li>Check that your device's sound is turned on</li>
                <li>Try using headphones to verify audio output</li>
                <li>Some browsers might require user interaction before playing audio</li>
                <li>If MP3 files fail but the Base64 audio works, there might be a format compatibility issue</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioTest;