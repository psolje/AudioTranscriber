import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTime } from '@/lib/utils';
import { Pencil, Trash2, Save, X, Music } from 'lucide-react';
import { AudioUpload } from './audio-upload';
import { apiRequest } from '@/lib/queryClient';

interface AudioSample {
  id: number;
  title: string;
  path: string;
  transcript: string;
  duration: number;
}

export const AudioSamplesManager: React.FC = () => {
  const { toast } = useToast();
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTranscript, setEditTranscript] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSample, setSelectedSample] = useState<AudioSample | null>(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audio-samples');
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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sample: AudioSample) => {
    setEditingId(sample.id);
    setEditTitle(sample.title);
    setEditTranscript(sample.transcript);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditTranscript('');
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/audio-samples/${id}`, {
        title: editTitle,
        transcript: editTranscript,
      });

      if (response.ok) {
        const updatedSample = await response.json();
        setSamples(samples.map(sample => sample.id === id ? updatedSample : sample));
        setEditingId(null);
        toast({
          title: 'Success',
          description: 'Audio sample updated successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to update audio sample',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating sample:', error);
      toast({
        title: 'Error',
        description: 'Failed to update audio sample',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this audio sample?')) {
      return;
    }

    try {
      const response = await apiRequest('DELETE', `/api/admin/audio-samples/${id}`);

      if (response.ok) {
        setSamples(samples.filter(sample => sample.id !== id));
        toast({
          title: 'Success',
          description: 'Audio sample deleted successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to delete audio sample',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting sample:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete audio sample',
        variant: 'destructive',
      });
    }
  };

  const handleUploadSuccess = () => {
    fetchSamples();
  };

  const openSampleDetails = (sample: AudioSample) => {
    setSelectedSample(sample);
    setShowDialog(true);
  };

  if (loading && samples.length === 0) {
    return <div className="flex justify-center items-center p-8">Loading audio samples...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Samples Management</CardTitle>
          <CardDescription>
            Manage your audio samples for transcription tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AudioUpload onUploadSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Audio Samples</CardTitle>
          <CardDescription>
            {samples.length} audio samples available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of all audio samples</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map(sample => (
                <TableRow key={sample.id}>
                  <TableCell>
                    {editingId === sample.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Sample title"
                      />
                    ) : (
                      <div 
                        className="cursor-pointer hover:text-primary font-medium"
                        onClick={() => openSampleDetails(sample)}
                      >
                        {sample.title}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatTime(sample.duration)}</TableCell>
                  <TableCell>
                    {editingId === sample.id ? (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSaveEdit(sample.id)}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(sample)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(sample.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sample Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audio Sample Details</DialogTitle>
          </DialogHeader>
          {selectedSample && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="px-3 py-1">
                  <Music className="h-4 w-4 mr-2" />
                  {formatTime(selectedSample.duration)}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  ID: {selectedSample.id}
                </Badge>
              </div>
              
              <div>
                <Label>Title</Label>
                <div className="text-lg font-medium mt-1">{selectedSample.title}</div>
              </div>
              
              <div>
                <Label>File Path</Label>
                <div className="text-sm bg-muted p-2 rounded mt-1 font-mono">
                  {selectedSample.path}
                </div>
              </div>
              
              <div>
                <Label>Transcript</Label>
                <div className="bg-muted p-3 rounded-md mt-1 whitespace-pre-wrap">
                  {selectedSample.transcript}
                </div>
              </div>
              
              <div>
                <Label>Audio Preview</Label>
                <div className="mt-2">
                  <audio
                    controls
                    src={`/${selectedSample.path}`}
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedSample && (
              <Button onClick={() => {
                setShowDialog(false);
                handleEdit(selectedSample);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Sample
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transcript Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Audio Sample</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Sample title"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-transcript">Transcript</Label>
              <Textarea
                id="edit-transcript"
                value={editTranscript}
                onChange={(e) => setEditTranscript(e.target.value)}
                placeholder="Sample transcript"
                className="mt-1 min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={() => editingId && handleSaveEdit(editingId)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};