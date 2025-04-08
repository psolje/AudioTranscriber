import React from "react";
import { Button } from "./button";
import { CheckCircle, Gauge } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface ResultItem {
  sampleId: number;
  sampleTitle: string;
  accuracy: number;
  wpm: number;
  timeTaken: number; // in seconds
}

interface FinalResultsProps {
  results: ResultItem[];
  avgAccuracy: number;
  avgWpm: number;
  onRestart: () => void;
}

export const FinalResults: React.FC<FinalResultsProps> = ({
  results,
  avgAccuracy,
  avgWpm,
  onRestart,
}) => {
  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-medium text-center">Test Completed</h2>
        <p className="text-center text-muted-foreground mt-2">Here's your overall performance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Average Accuracy */}
        <div className="border rounded-lg p-4 flex items-center">
          <div className="mr-4">
            <CheckCircle className="text-success h-8 w-8" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Average Accuracy</h3>
            <div className="text-2xl font-bold text-success">{avgAccuracy}%</div>
          </div>
        </div>
        
        {/* Average WPM */}
        <div className="border rounded-lg p-4 flex items-center">
          <div className="mr-4">
            <Gauge className="text-primary h-8 w-8" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Average WPM</h3>
            <div className="text-2xl font-bold text-primary">{avgWpm}</div>
          </div>
        </div>
      </div>
      
      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Audio</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>WPM</TableHead>
              <TableHead>Time Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.sampleId}>
                <TableCell className="font-medium">{result.sampleTitle}</TableCell>
                <TableCell className="text-success font-medium">{result.accuracy}%</TableCell>
                <TableCell className="text-primary font-medium">{result.wpm}</TableCell>
                <TableCell className="text-muted-foreground">{formatTime(result.timeTaken)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={onRestart}
          className="py-2 px-6 bg-primary hover:bg-primary-dark"
        >
          Start New Test
        </Button>
      </div>
    </div>
  );
};

export default FinalResults;
