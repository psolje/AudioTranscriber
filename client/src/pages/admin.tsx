import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { AdminTable } from "@/components/admin/admin-table";
import { UserDetailsModal } from "@/components/admin/user-details-modal";
import { AudioSamplesManager } from "@/components/admin/audio-samples-manager";
import { Button } from "@/components/ui/button";
import { LogOut, User, Database, Info } from "lucide-react";
import { resultsToCSV, detailedResultToCSV, downloadCSV } from "@/lib/utils/csv-export";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserResult {
  id: number;
  user: {
    name: string;
    email: string;
  };
  testDate: Date;
  testMode: string;
  avgAccuracy: number | null;
  avgWpm: number | null;
  sampleIds: number[];
  results: {
    sampleId: number;
    sampleTitle: string;
    sampleDuration: number;
    accuracy: number;
    wpm: number;
    timeTaken: number;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [filters, setFilters] = useState<{ name?: string; date?: string; minScore?: string }>({});
  
  // Modal state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<{
    name: string;
    email: string;
    testDate: Date;
    testType: string;
    avgAccuracy: number;
    avgWpm: number;
    results: any[];
  } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
    }
  }, [user, isAdmin, setLocation]);
  
  // Fetch test sessions for admin
  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/test-sessions', perPage, currentPage],
    enabled: !!isAdmin,
  });
  
  // Fetch filtered results
  const { data: filteredData, isLoading: isFilterLoading, refetch: refetchFiltered } = useQuery({
    queryKey: ['/api/admin/test-sessions/filter', filters],
    enabled: !!isAdmin && Object.values(filters).some(v => v !== undefined),
  });
  
  // Fetch session details for modal
  const { data: sessionDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['/api/admin/test-sessions', selectedUserId],
    enabled: !!selectedUserId,
  });
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle filtering
  const handleFilter = (newFilters: { name?: string; date?: string; minScore?: string }) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };
  
  // Handle view details
  const handleViewDetails = (id: number) => {
    setSelectedUserId(id);
    setIsModalOpen(true);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Export all results to CSV
  const handleExportCSV = () => {
    const results = filteredData || sessionsData?.sessions || [];
    const formattedResults = results.map(session => ({
      id: session.id,
      name: session.user.name,
      email: session.user.email,
      testDate: new Date(session.testDate).toISOString().split('T')[0],
      testType: session.testMode === 'standard' ? 'Standard (5 samples)' : 'Extended (10 samples)',
      avgAccuracy: session.avgAccuracy || 0,
      avgWpm: session.avgWpm || 0,
      sampleResults: session.results || [],
    }));
    
    const csv = resultsToCSV(formattedResults);
    downloadCSV(csv, `transcription_results_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  // Export single user results
  const handleDownloadUserResults = () => {
    if (selectedUserData) {
      const csv = detailedResultToCSV(selectedUserData);
      downloadCSV(csv, `${selectedUserData.name.replace(/\s+/g, '_')}_results.csv`);
    }
  };
  
  // Switch to transcription test view
  const handleTranscriptionView = () => {
    setLocation("/test");
  };
  
  // Update modal data when session details load
  useEffect(() => {
    if (sessionDetails && !isDetailsLoading) {
      setSelectedUserData({
        name: sessionDetails.user.name,
        email: sessionDetails.user.email,
        testDate: new Date(sessionDetails.testDate),
        testType: sessionDetails.testMode === 'standard' ? 'Standard (5 samples)' : 'Extended (10 samples)',
        avgAccuracy: sessionDetails.avgAccuracy || 0,
        avgWpm: sessionDetails.avgWpm || 0,
        results: sessionDetails.results || [],
      });
    }
  }, [sessionDetails, isDetailsLoading]);
  
  // Format results for the table
  const formatResultsForTable = () => {
    const results = filteredData || sessionsData?.sessions || [];
    return results.map(session => ({
      id: session.id,
      name: session.user.name,
      email: session.user.email,
      testDate: new Date(session.testDate),
      avgAccuracy: session.avgAccuracy,
      avgWpm: session.avgWpm,
      sampleCount: session.sampleIds.length,
    }));
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Navigation Bar */}
      <nav className="bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-medium text-lg">Audio Transcription Tool</span>
            </div>
            <div className="flex items-center">
              <span className="text-white mr-2">{user?.name || "Admin"}</span>
              <Button 
                variant="outline"
                size="sm"
                onClick={logout} 
                className="text-white bg-primary-dark px-3 py-1 rounded hover:bg-opacity-80"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs Navigation */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex border-b">
            <button 
              className="px-6 py-3 text-muted-foreground font-medium text-sm hover:text-primary focus:outline-none"
              onClick={handleTranscriptionView}
            >
              Transcription Test
            </button>
            <button className="px-6 py-3 border-b-2 border-primary text-primary font-medium text-sm focus:outline-none">
              Admin Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Admin Credentials Info */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Info className="h-5 w-5 text-primary" />
          <AlertTitle>Admin Credentials</AlertTitle>
          <AlertDescription>
            <strong>Email:</strong> admin@example.com | <strong>Password:</strong> admin123
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="results" className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="results">
              <User className="mr-2 h-4 w-4" />
              Test Results
            </TabsTrigger>
            <TabsTrigger value="audio">
              <Database className="mr-2 h-4 w-4" />
              Audio Samples
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="mt-6">
            {isLoading || isFilterLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <AdminTable
                results={formatResultsForTable()}
                onViewDetails={handleViewDetails}
                onExportCSV={handleExportCSV}
                onFilter={handleFilter}
                totalResults={sessionsData?.count || 0}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                perPage={perPage}
              />
            )}
          </TabsContent>
          
          <TabsContent value="audio" className="mt-6">
            <AudioSamplesManager />
          </TabsContent>
        </Tabs>
        
        {/* User Details Modal */}
        <UserDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userData={selectedUserData}
          onDownload={handleDownloadUserResults}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
