interface TestResult {
  id: number;
  name: string;
  email: string;
  testDate: string;
  testType: string;
  avgAccuracy: number;
  avgWpm: number;
  sampleResults: {
    sampleTitle: string;
    accuracy: number;
    wpm: number;
    timeTaken: number;
  }[];
}

/**
 * Convert test results to CSV format
 * @param results Array of test results
 * @returns CSV string
 */
export function resultsToCSV(results: TestResult[]): string {
  if (!results || results.length === 0) {
    return '';
  }

  // Headers
  const headers = [
    'ID',
    'Name',
    'Email',
    'Test Date',
    'Test Type',
    'Avg. Accuracy (%)',
    'Avg. WPM',
    'Sample Count',
  ];

  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Create rows
  const rows = results.map(result => [
    result.id.toString(),
    result.name,
    result.email,
    result.testDate,
    result.testType,
    result.avgAccuracy.toString(),
    result.avgWpm.toString(),
    result.sampleResults.length.toString(),
  ]);

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}

/**
 * Convert a single test result with detailed sample results to CSV
 * @param result Detailed test result
 * @returns CSV string
 */
export function detailedResultToCSV(result: TestResult): string {
  if (!result) {
    return '';
  }

  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // User summary headers and data
  const summaryHeaders = [
    'Name',
    'Email',
    'Test Date',
    'Test Type',
    'Avg. Accuracy (%)',
    'Avg. WPM',
  ];

  const summaryData = [
    result.name,
    result.email,
    result.testDate,
    result.testType,
    result.avgAccuracy.toString(),
    result.avgWpm.toString(),
  ];

  // Sample results headers
  const sampleHeaders = [
    'Sample',
    'Accuracy (%)',
    'WPM',
    'Time Taken',
  ];

  // Sample results rows
  const sampleRows = result.sampleResults.map(sample => [
    sample.sampleTitle,
    sample.accuracy.toString(),
    sample.wpm.toString(),
    formatTime(sample.timeTaken),
  ]);

  // Create CSV
  const csv = [
    'User Summary',
    summaryHeaders.join(','),
    summaryData.join(','),
    '',
    'Sample Results',
    sampleHeaders.join(','),
    ...sampleRows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}

/**
 * Download CSV data as a file
 * @param csvData CSV data string
 * @param filename Filename for the downloaded file
 */
export function downloadCSV(csvData: string, filename: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
