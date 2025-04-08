import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a timestamp in seconds to a MM:SS display format
 * @param seconds - Number of seconds to format
 * @returns Formatted string in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a date as YYYY-MM-DD
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Trim and normalize text for comparison by removing excess whitespace
 * @param text - Text to normalize
 * @returns Normalized text string
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
}

/**
 * Determine color based on accuracy percentage
 * @param accuracy - Accuracy percentage (0-100)
 * @returns CSS color class
 */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-success";
  if (accuracy >= 75) return "text-warning";
  return "text-destructive";
}

/**
 * Generate a unique identifier
 * @returns Unique string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
