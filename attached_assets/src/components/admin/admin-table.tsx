import React, { useState } from "react";
import { Eye, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface UserResult {
  id: number;
  name: string;
  email: string;
  testDate: Date;
  avgAccuracy: number | null;
  avgWpm: number | null;
  sampleCount: number;
}

interface AdminTableProps {
  results: UserResult[];
  onViewDetails: (userId: number) => void;
  onExportCSV: () => void;
  onFilter: (filters: { name?: string; date?: string; minScore?: string }) => void;
  totalResults: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage: number;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  results,
  onViewDetails,
  onExportCSV,
  onFilter,
  totalResults,
  currentPage,
  onPageChange,
  perPage,
}) => {
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("0");

  const handleFilter = () => {
    onFilter({
      name: nameFilter || undefined,
      date: dateFilter || undefined,
      minScore: scoreFilter || undefined,
    });
  };

  // Calculate pagination values
  const totalPages = Math.ceil(totalResults / perPage);
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(startItem + perPage - 1, totalResults);

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">User Results Dashboard</h2>
        <Button 
          onClick={onExportCSV}
          className="py-2 px-4 bg-primary hover:bg-primary-dark flex items-center"
        >
          <Download className="mr-1 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="filter-name" className="block text-sm font-medium text-muted-foreground mb-1">
            Filter by Name
          </label>
          <Input
            id="filter-name"
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleFilter()}
          />
        </div>
        <div>
          <label htmlFor="filter-date" className="block text-sm font-medium text-muted-foreground mb-1">
            Filter by Date
          </label>
          <Input
            id="filter-date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            onBlur={handleFilter}
          />
        </div>
        <div>
          <label htmlFor="filter-score" className="block text-sm font-medium text-muted-foreground mb-1">
            Minimum Score
          </label>
          <Select
            value={scoreFilter}
            onValueChange={(value) => {
              setScoreFilter(value);
              onFilter({
                name: nameFilter || undefined,
                date: dateFilter || undefined,
                minScore: value || undefined,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Scores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Scores</SelectItem>
              <SelectItem value="70">70% and above</SelectItem>
              <SelectItem value="80">80% and above</SelectItem>
              <SelectItem value="90">90% and above</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Test Date</TableHead>
              <TableHead>Avg. Accuracy</TableHead>
              <TableHead>Avg. WPM</TableHead>
              <TableHead>Samples</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.name}</TableCell>
                  <TableCell className="text-muted-foreground">{result.email}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(result.testDate)}</TableCell>
                  <TableCell className="font-medium text-success">
                    {result.avgAccuracy !== null ? `${result.avgAccuracy}%` : '-'}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {result.avgWpm !== null ? result.avgWpm : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{result.sampleCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(result.id)}
                      className="text-primary hover:text-primary-dark"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalResults} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
