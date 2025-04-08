import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Converts an audio file to MP3 format for better browser compatibility
 * @param inputPath Path to the input audio file
 * @returns Path to the converted MP3 file
 */
export async function convertToMP3(inputPath: string): Promise<string> {
  try {
    // Create the output path with .mp3 extension
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.mp3`);
    
    console.log(`Converting ${inputPath} to MP3 format...`);
    
    // Execute ffmpeg to convert the file
    const command = `ffmpeg -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 192k "${outputPath}" -y`;
    await execAsync(command);
    
    console.log(`Conversion complete: ${outputPath}`);
    
    // Delete the original file if conversion was successful
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(inputPath);
      console.log(`Deleted original file: ${inputPath}`);
    }
    
    return outputPath;
  } catch (error: any) {
    console.error('Error converting audio file:', error);
    throw new Error(`Failed to convert audio file: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Checks if an audio file is MP3 format
 * @param filePath Path to the audio file
 * @returns Boolean indicating if the file is MP3
 */
export function isMP3(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.mp3';
}

/**
 * Gets audio file duration in seconds using ffmpeg
 * @param filePath Path to the audio file
 * @returns Duration in seconds
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error: any) {
    console.error('Error getting audio duration:', error);
    // Return a default duration if extraction fails
    return 0;
  }
}