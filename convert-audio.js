import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

/**
 * Converts an audio file to MP3 format for better browser compatibility
 * @param inputPath Path to the input audio file
 * @returns Path to the converted MP3 file
 */
async function convertToMP3(inputPath) {
  try {
    // Create the output path with .mp3 extension
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.mp3`);
    
    console.log(`Converting ${inputPath} to MP3 format...`);
    
    // Execute ffmpeg to convert the file
    const command = `ffmpeg -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 192k "${outputPath}" -y`;
    await execAsync(command);
    
    console.log(`Conversion complete: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error converting audio file:', error);
    throw new Error(`Failed to convert audio file: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Checks if an audio file is MP3 format
 * @param filePath Path to the audio file
 * @returns Boolean indicating if the file is MP3
 */
function isMP3(filePath) {
  return path.extname(filePath).toLowerCase() === '.mp3';
}

// Convert all audio files in the audio-samples directory
async function convertAllAudioFiles() {
  const audioDir = path.join(__dirname, 'public', 'audio-samples');
  
  // Ensure directory exists
  if (!fs.existsSync(audioDir)) {
    console.log(`Directory ${audioDir} does not exist. Creating...`);
    fs.mkdirSync(audioDir, { recursive: true });
    return;
  }
  
  // Get all files in the directory
  const files = fs.readdirSync(audioDir);
  
  console.log(`Found ${files.length} files in ${audioDir}`);
  
  // Filter out non-audio files and MP3 files
  const nonMp3Files = files.filter(file => {
    const filePath = path.join(audioDir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    const fileExt = path.extname(file).toLowerCase();
    
    // Skip directories and non-audio files
    if (isDirectory || !(['.wav', '.ogg', '.aac', '.m4a'].includes(fileExt))) {
      return false;
    }
    
    // Skip already MP3 files
    return !isMP3(filePath);
  });
  
  console.log(`Found ${nonMp3Files.length} non-MP3 audio files to convert`);
  
  // Convert all non-MP3 files
  for (const file of nonMp3Files) {
    const filePath = path.join(audioDir, file);
    
    try {
      const convertedPath = await convertToMP3(filePath);
      console.log(`Successfully converted ${file} to ${path.basename(convertedPath)}`);
      
      // Delete the original file
      fs.unlinkSync(filePath);
      console.log(`Deleted original file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to convert ${file}:`, error);
    }
  }
  
  console.log('Conversion complete!');
}

// Run the conversion
convertAllAudioFiles().catch(console.error);