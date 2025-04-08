/**
 * Calculates the Levenshtein distance between two strings
 * Used to measure the difference between two sequences
 * @param a First string
 * @param b Second string
 * @returns The Levenshtein distance
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate accuracy percentage based on Levenshtein distance
 * @param userText The user's transcription
 * @param referenceText The original/correct text
 * @returns Accuracy percentage (0-100)
 */
export function calculateLevenshteinAccuracy(userText: string, referenceText: string): number {
  // Normalize texts - convert to lowercase, trim whitespace
  const normalizedUserText = userText.toLowerCase().trim();
  const normalizedReferenceText = referenceText.toLowerCase().trim();
  
  if (normalizedReferenceText.length === 0) return 0;
  
  const distance = levenshteinDistance(normalizedUserText, normalizedReferenceText);
  const maxLength = Math.max(normalizedUserText.length, normalizedReferenceText.length);
  
  // Calculate accuracy as percentage
  const accuracy = ((maxLength - distance) / maxLength) * 100;
  
  // Round to nearest integer and ensure it's between 0 and 100
  return Math.max(0, Math.min(100, Math.round(accuracy)));
}

/**
 * Split text into words and calculate word-level accuracy
 * @param userText The user's transcription
 * @param referenceText The original/correct text
 * @returns Object containing word counts and accuracy
 */
export function calculateWordAccuracy(userText: string, referenceText: string): {
  correctWords: number;
  totalWords: number;
  accuracy: number;
} {
  // Split into words (treating punctuation as part of words)
  const userWords = userText.toLowerCase().trim().split(/\s+/);
  const referenceWords = referenceText.toLowerCase().trim().split(/\s+/);
  
  if (referenceWords.length === 0) {
    return { correctWords: 0, totalWords: 0, accuracy: 0 };
  }
  
  // Count correct words
  let correctWords = 0;
  const minLength = Math.min(userWords.length, referenceWords.length);
  
  for (let i = 0; i < minLength; i++) {
    if (userWords[i] === referenceWords[i]) {
      correctWords++;
    }
  }
  
  // Calculate accuracy as percentage
  const accuracy = (correctWords / referenceWords.length) * 100;
  
  return {
    correctWords,
    totalWords: referenceWords.length,
    accuracy: Math.round(accuracy),
  };
}
