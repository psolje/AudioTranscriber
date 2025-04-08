import React from "react";
import { X, Download } from "lucide-react";
import { Button } from "../ui/button";
import { CircularProgress } from "../ui/circular-progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface SampleResult {
  sampleId: number;
  sampleTitle: string;
  sampleDuration: number;
  accuracy: number;
  wpm: number;
  timeTaken: number;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    testDate: Date;
    testType: string;
    avgAccuracy: number;
    avgWpm: number;
    results: SampleResult[];
  } | null;
  onDownload: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userData,
  onDownload,
}) => {
  if (!userData) return null;

  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{userData.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-2">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="ml-1 text-foreground">{userData.email}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Test Date:</span>
              <span className="ml-1 text-foreground">{formatDate(userData.testDate)}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Test Type:</span>
              <span className="ml-1 text-foreground">{userData.testType}</span>
            </div>
          </div>
          
          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Average Accuracy</h4>
              <div className="flex items-center">
                <div className="w-16 h-16 mr-3">
                  <CircularProgress 
                    value={userData.avgAccuracy} 
                    size={64}
                    strokeWidth={8}
                    color="hsl(var(--success))"
                  />
                </div>
                <div className="text-2xl font-bold text-success">{userData.avgAccuracy}%</div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Average WPM</h4>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-primary mr-2">{userData.avgWpm}</div>
                <div className="text-muted-foreground">WPM</div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(userData.avgWpm, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detailed Results Table */}
          <h4 className="font-medium mb-3">Sample Results</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample</TableHead>
                  <TableHead>Audio Length</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>WPM</TableHead>
                  <TableHead>Time Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userData.results.map((result) => (
                  <TableRow key={result.sampleId}>
                    <TableCell className="text-foreground">{result.sampleTitle}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(result.sampleDuration)}</TableCell>
                    <TableCell className="text-success font-medium">{result.accuracy}%</TableCell>
                    <TableCell className="text-primary font-medium">{result.wpm}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(result.timeTaken)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="mr-2"
          >
            Close
          </Button>
          <Button 
            onClick={onDownload}
            className="bg-primary text-white flex items-center"
          >
            <Download className="mr-1 h-4 w-4" />
            Download Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
