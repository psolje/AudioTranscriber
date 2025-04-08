import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Plus, Trash2, Play, Pause, Edit, X } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { formatTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AudioUpload from './audio-upload';
import { AudioSampleEditor } from './audio-sample-editor';

interface AudioSample {
  id: number;
  title: string;
  path: string;
  transcript: string;
  duration: number;
}

export const AudioSamplesManager: React.FC = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [editingSample, setEditingSample] = useState<AudioSample | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: audioSamples, isLoading, refetch } = useQuery<AudioSample[]>({
    queryKey: ['/api/audio-samples'],
  });

  const handleDeleteSample = async (id: number) => {
    if (!confirm('Are you sure you want to delete this audio sample?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/audio-samples/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete audio sample');
      }

      toast({
        title: 'Success',
        description: 'Audio sample deleted successfully',
        variant: 'default',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/audio-samples'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to delete audio sample',
        variant: 'destructive',
      });
    }
  };

  const handlePlay = (id: number) => {
    setCurrentPlayingId(id);
  };

  const handlePause = () => {
    setCurrentPlayingId(null);
  };

  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    refetch();
  };
  
  const handleEditSample = (sample: AudioSample) => {
    setEditingSample(sample);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateSample = (updatedSample: AudioSample) => {
    setIsEditDialogOpen(false);
    setEditingSample(null);
    queryClient.invalidateQueries({ queryKey: ['/api/audio-samples'] });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Audio Samples</CardTitle>
          <CardDescription>
            Manage audio samples for transcription tests
          </CardDescription>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Sample
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Audio Sample</DialogTitle>
              <DialogDescription>
                Upload a new audio file with its transcript to add to the test library.
              </DialogDescription>
            </DialogHeader>
            <AudioUpload onUploadSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : audioSamples && audioSamples.length > 0 ? (
          <Table>
            <TableCaption>List of available audio samples</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Audio</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audioSamples.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell>{sample.id}</TableCell>
                  <TableCell className="font-medium">{sample.title}</TableCell>
                  <TableCell>{formatTime(sample.duration)}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <AudioPlayer
                        src={sample.path}
                        onPlay={() => handlePlay(sample.id)}
                        onPause={handlePause}
                        onRestart={() => handlePlay(sample.id)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm truncate" title={sample.transcript}>
                    {sample.transcript.length > 60 
                      ? `${sample.transcript.substring(0, 60)}...` 
                      : sample.transcript}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSample(sample)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSample(sample.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No audio samples found. Add your first one!</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          {audioSamples ? audioSamples.length : 0} audio samples available
        </p>
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Audio Sample</DialogTitle>
            <DialogDescription>
              Update the title or transcript for this audio sample
            </DialogDescription>
          </DialogHeader>
          {editingSample && (
            <AudioSampleEditor
              sample={editingSample}
              onUpdate={handleUpdateSample}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AudioSamplesManager;