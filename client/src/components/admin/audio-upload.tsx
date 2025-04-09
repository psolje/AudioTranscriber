import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileAudio, Loader2 } from 'lucide-react';

interface AudioUploadProps {
  onUploadSuccess: () => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onUploadSuccess }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      // Set title based on filename (without extension) if title is empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: 'Error',
        description: 'Please select an audio file',
        variant: 'destructive',
      });
      return;
    }

    if (!title || !transcript) {
      toast({
        title: 'Error',
        description: 'Title and transcript are required',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('audioFile', fileInputRef.current.files[0]);
    formData.append('title', title);
    formData.append('transcript', transcript);

    setUploading(true);

    try {
      const response = await fetch('/api/admin/audio-samples', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload success:', data);
        
        // Reset form
        setTitle('');
        setTranscript('');
        setFileName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        toast({
          title: 'Success',
          description: 'Audio sample uploaded successfully',
        });

        onUploadSuccess();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Upload Failed',
          description: errorData.message || 'There was an error uploading the audio file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the audio file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-card/50 border-dashed border-2">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audio-file">Audio File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="audio-file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="flex-1"
                  disabled={uploading}
                />
              </div>
              {fileName && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileAudio className="h-4 w-4" />
                  <span className="truncate">{fileName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title for the audio sample"
                disabled={uploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Enter the accurate transcript for this audio"
              rows={4}
              disabled={uploading}
            />
            <p className="text-sm text-muted-foreground">
              The transcript should match the audio content exactly.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Audio
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};