/**
 * Calculates the Words Per Minute (WPM) typing speed
 * @param text The text that was typed
 * @param timeInSeconds The time taken to type the text in seconds
 * @returns WPM value rounded to the nearest integer
 */
export function calculateWPM(text: string, timeInSeconds: number): number {
  if (timeInSeconds <= 0) return 0;
  
  // Count the number of words (a word is defined as a sequence of characters separated by spaces)
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Convert seconds to minutes
  const timeInMinutes = timeInSeconds / 60;
  
  // Calculate WPM
  const wpm = wordCount / timeInMinutes;
  
  // Round to the nearest integer
  return Math.round(wpm);
}

/**
 * Calculates the WPM based on standard character count method (5 characters = 1 word)
 * This is an alternative method used in some typing tests
 * @param text The text that was typed
 * @param timeInSeconds The time taken to type the text in seconds
 * @returns WPM value rounded to the nearest integer
 */
export function calculateWPMByCharacters(text: string, timeInSeconds: number): number {
  if (timeInSeconds <= 0) return 0;
  
  // Count characters (excluding spaces)
  const characterCount = text.replace(/\s+/g, '').length;
  
  // Convert to words (using 5 characters = 1 word standard)
  const wordCount = characterCount / 5;
  
  // Convert seconds to minutes
  const timeInMinutes = timeInSeconds / 60;
  
  // Calculate WPM
  const wpm = wordCount / timeInMinutes;
  
  // Round to the nearest integer
  return Math.round(wpm);
}
