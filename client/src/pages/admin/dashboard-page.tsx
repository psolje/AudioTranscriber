import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Settings as SettingsIcon, FileText as FileTextIcon, 
  Download as DownloadIcon, RefreshCw as RefreshCwIcon,
  Trash as TrashIcon, Check as CheckIcon, X as XIcon,
  Calendar as CalendarIcon, Search as SearchIcon, File as FileIcon
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Audio Samples Manager Component
const AudioSamplesManager = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editSampleId, setEditSampleId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTranscript, setEditTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTranscript, setNewTranscript] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Fetch audio samples
  useQuery({
    queryKey: ["/api/audio-samples"],
    queryFn: async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/audio-samples");
        if (!res.ok) throw new Error("Failed to fetch audio samples");
        const data = await res.json();
        setSamples(data);
        return data;
      } catch (error) {
        console.error("Error fetching audio samples:", error);
        toast({
          title: "Error",
          description: "Failed to load audio samples",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
  });
  
  // Delete audio sample mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/audio-samples/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sample deleted",
        description: "Audio sample has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audio-samples"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete audio sample",
        variant: "destructive",
      });
    },
  });
  
  // Update audio sample mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/audio-samples/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sample updated",
        description: "Audio sample has been updated successfully",
      });
      setEditSampleId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/audio-samples"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update audio sample",
        variant: "destructive",
      });
    },
  });
  
  // Upload audio sample mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/audio-samples", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload audio sample");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sample uploaded",
        description: "Audio sample has been uploaded successfully",
      });
      setUploadOpen(false);
      setFile(null);
      setNewTitle("");
      setNewTranscript("");
      queryClient.invalidateQueries({ queryKey: ["/api/audio-samples"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload audio sample",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit save
  const handleSaveEdit = async (id: number) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        id,
        data: { title: editTitle, transcript: editTranscript },
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  // Handle sample upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("audioFile", file);
    formData.append("title", newTitle || file.name);
    formData.append("transcript", newTranscript);
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Start editing sample
  const startEdit = (sample: any) => {
    setEditSampleId(sample.id);
    setEditTitle(sample.title);
    setEditTranscript(sample.transcript);
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditSampleId(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Audio Samples Manager</CardTitle>
            <CardDescription>Manage audio samples for transcription tests</CardDescription>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <Button onClick={() => setUploadOpen(true)}>
              Upload New Sample
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Audio Sample</DialogTitle>
                <DialogDescription>
                  Upload a new audio file for transcription testing. Supported formats: MP3, WAV.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="audio-file">Audio File</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    required
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground">
                      Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Sample title (defaults to filename)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transcript">Transcript</Label>
                  <textarea
                    id="transcript"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newTranscript}
                    onChange={(e) => setNewTranscript(e.target.value)}
                    placeholder="Enter the correct transcript for this audio"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading || !file || !newTranscript}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Sample"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading audio samples...</p>
          </div>
        ) : samples.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <FileIcon className="w-12 h-12 mx-auto text-muted-foreground/60" />
            <p className="mt-2 text-muted-foreground">No audio samples found</p>
            <Button variant="outline" className="mt-4" onClick={() => setUploadOpen(true)}>
              Upload First Sample
            </Button>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Transcript</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((sample) => (
                  <TableRow key={sample.id}>
                    {editSampleId === sample.id ? (
                      // Edit mode
                      <>
                        <TableCell>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="max-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <textarea
                            value={editTranscript}
                            onChange={(e) => setEditTranscript(e.target.value)}
                            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {sample.duration ? `${sample.duration.toFixed(1)}s` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveEdit(sample.id)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // View mode
                      <>
                        <TableCell>
                          <div className="font-medium">{sample.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {sample.path.split('/').pop()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-h-[100px] overflow-y-auto">
                            {sample.transcript}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {sample.duration ? `${sample.duration.toFixed(1)}s` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(sample)}>
                              Edit
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete "{sample.title}"? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => deleteMutation.mutate(sample.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AdminDashboardPage() {
  const { admin, logoutMutation, updatePasswordMutation } = useAdminAuth();
  
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch test sessions data
  const { data: sessionsData, isLoading: isDataLoading } = useQuery({
    queryKey: ["/api/admin/test-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/test-sessions");
      if (!res.ok) throw new Error("Failed to fetch test sessions");
      return res.json();
    },
  });
  
  const cleanReportsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/test-sessions");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/test-sessions"] });
    },
  });
  
  // Derived state for displaying data
  const displayData = sessionsData?.sessions || [];
  
  // Logout handler
  const logout = () => {
    logoutMutation.mutate();
  };
  
  // Export to CSV handler
  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = displayData.map((session: any) => ({
        user_name: session.user.name,
        user_email: session.user.email,
        test_date: new Date(session.testDate).toLocaleDateString(),
        test_mode: session.testMode,
        avg_accuracy: session.avgAccuracy || "N/A",
        avg_wpm: session.avgWpm || "N/A",
        completed: session.completed ? "Yes" : "No",
        sample_count: session.results?.length || 0,
      }));
      
      const headers = ["User Name", "Email", "Test Date", "Mode", "Avg. Accuracy", "Avg. WPM", "Completed", "Samples"];
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) => Object.values(row).join(","))
      ];
      
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", `transcription-results-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Apply filters
  const applyFilters = async () => {
    // In a full implementation, this would fetch filtered data from the API
    console.log("Applying filters:", { nameFilter, dateFilter, scoreFilter });
  };
  
  // Reset filters
  const resetFilters = () => {
    setNameFilter("");
    setDateFilter("");
    setScoreFilter("");
  };
  
  // Update password
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    
    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword
      });
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error handled in mutation
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
              <CardDescription>Manage your audio transcription database</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPasswordOpen(true)}
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Account
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Admin Password</DialogTitle>
                    <DialogDescription>
                      Change your admin account password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPasswordOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdatePassword}>
                      Update Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="destructive" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="reports">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">
            <FileTextIcon className="w-4 h-4 mr-2" />
            Test Reports
          </TabsTrigger>
          <TabsTrigger value="audio">
            <FileIcon className="w-4 h-4 mr-2" />
            Audio Samples
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Test Sessions Report</CardTitle>
              <CardDescription>
                View and filter user transcription test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="name-filter">Filter by User</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name-filter"
                        placeholder="User name"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="date-filter">Filter by Date</Label>
                    <Input
                      id="date-filter"
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="score-filter">Min Accuracy Score</Label>
                    <Input
                      id="score-filter"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Minimum score (%)"
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div className="space-x-2">
                    <Button variant="outline" onClick={applyFilters}>
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Apply Filters
                    </Button>
                    <Button variant="ghost" onClick={resetFilters}>
                      <RefreshCwIcon className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={exportToCSV} disabled={isExporting || displayData.length === 0}>
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Export CSV
                        </>
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Clean Reports
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete all test reports? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            variant="destructive" 
                            onClick={() => cleanReportsMutation.mutate()}
                            disabled={cleanReportsMutation.isPending}
                          >
                            {cleanReportsMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete All Reports"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {isDataLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading test sessions...</p>
                  </div>
                ) : displayData.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">
                    <FileTextIcon className="w-12 h-12 mx-auto text-muted-foreground/60" />
                    <p className="mt-2 text-muted-foreground">No test sessions found</p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Test Mode</TableHead>
                          <TableHead className="text-center">Avg Accuracy</TableHead>
                          <TableHead className="text-center">Avg WPM</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Samples</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayData.map((session: any) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{session.user.name}</span>
                                <span className="text-xs text-muted-foreground">{session.user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                {new Date(session.testDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{session.testMode}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {session.avgAccuracy !== null ? (
                                <Badge 
                                  variant={session.avgAccuracy >= 80 ? "default" : "outline"}
                                  className={session.avgAccuracy >= 80 ? "" : "text-yellow-600"}
                                >
                                  {session.avgAccuracy}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {session.avgWpm !== null ? (
                                <span className="font-medium">{session.avgWpm}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {session.completed ? (
                                <Badge variant="outline" className="bg-green-50 text-green-600">
                                  <CheckIcon className="w-3 h-3 mr-1" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-600">
                                  <XIcon className="w-3 h-3 mr-1" />
                                  Incomplete
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {session.results?.length || 0}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioSamplesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}