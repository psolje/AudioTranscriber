import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { AudioSample } from '@shared/schema';
import { toast } from '@/hooks/use-toast';

interface AudioSampleEditorProps {
  sample: AudioSample;
  onUpdate: (updatedSample: AudioSample) => void;
  onCancel: () => void;
}

export const AudioSampleEditor: React.FC<AudioSampleEditorProps> = ({
  sample,
  onUpdate,
  onCancel,
}) => {
  const [title, setTitle] = useState(sample.title);
  const [transcript, setTranscript] = useState(sample.transcript);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (!transcript.trim()) {
      toast({
        title: "Validation Error",
        description: "Transcript cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest(
        'PATCH',
        `/api/admin/audio-samples/${sample.id}`,
        { title, transcript }
      );
      
      if (response.ok) {
        const updatedSample = await response.json();
        toast({
          title: "Success",
          description: "Audio sample updated successfully",
        });
        onUpdate(updatedSample);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error updating audio sample');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border shadow-md">
      <CardHeader>
        <CardTitle>Edit Audio Sample</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sample title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="transcript" className="text-sm font-medium">
              Transcript
            </label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Sample transcript"
              rows={6}
              required
            />
          </div>
          
          {/* Display audio details */}
          <div className="text-sm text-muted-foreground">
            <p>Duration: {sample.duration} seconds</p>
            <p>File: {sample.path.split('/').pop()}</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};