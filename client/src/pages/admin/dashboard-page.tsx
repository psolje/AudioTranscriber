import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader2, Settings as SettingsIcon, FileText as FileTextIcon, 
  Download as DownloadIcon, RefreshCw as RefreshCwIcon,
  Trash as TrashIcon, Check as CheckIcon, X as XIcon,
  Calendar as CalendarIcon, Search as SearchIcon, File as FileIcon
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// This would be a real component in a full implementation
const AudioSamplesManager = () => (
  <Card>
    <CardHeader>
      <CardTitle>Audio Samples Manager</CardTitle>
      <CardDescription>Manage audio samples for transcription tests</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Audio samples management UI would go here.</p>
    </CardContent>
  </Card>
);

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
                      <Button 
                        variant="destructive"
                        onClick={() => document.getElementById('delete-reports-dialog')?.click()}
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Clean Reports
                      </Button>
                      <button id="delete-reports-dialog" style={{ display: 'none' }}></button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete all test reports? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>Cancel</Button>
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