import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface AudioUploadProps {
  onUploadSuccess: () => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const validateForm = () => {
    if (!file) {
      setError('Please select an audio file to upload');
      return false;
    }
    if (!title.trim()) {
      setError('Please enter a title for the audio sample');
      return false;
    }
    if (!transcript.trim()) {
      setError('Please enter the transcript for this audio file');
      return false;
    }
    if (!duration.trim() || isNaN(Number(duration))) {
      setError('Please enter a valid duration in seconds');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('audioFile', file!);
    formData.append('title', title);
    formData.append('transcript', transcript);
    formData.append('duration', duration);
    
    try {
      const response = await fetch('/api/admin/audio-samples', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      // Clear form
      setFile(null);
      setTitle('');
      setTranscript('');
      setDuration('');
      
      // Show success message
      toast({
        title: 'Upload Successful',
        description: 'The audio sample has been uploaded successfully',
        variant: 'default',
      });
      
      // Invalidate audio samples query
      queryClient.invalidateQueries({ queryKey: ['/api/audio-samples'] });
      
      // Notify parent
      onUploadSuccess();
    } catch (err) {
      setError((err as Error).message || 'An error occurred during upload');
      toast({
        title: 'Upload Failed',
        description: (err as Error).message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Audio Sample</CardTitle>
        <CardDescription>
          Add a new audio sample with its transcript for the transcription test
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="audio-file">Audio File (WAV format recommended)</Label>
              <Input 
                id="audio-file" 
                type="file" 
                accept="audio/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sample Title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="transcript">Transcript</Label>
              <Textarea 
                id="transcript" 
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="The exact transcript of the audio file"
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input 
                id="duration" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="5"
                type="number"
                min="1"
                step="1"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="mt-6 w-full"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio Sample
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AudioUpload;