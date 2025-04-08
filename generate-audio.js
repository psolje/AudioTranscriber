import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a simple sine wave audio file
 * @param filename Filename to save
 * @param durationSecs Duration in seconds
 * @param frequency Frequency in Hz
 */
function generateAudioFile(filename, durationSecs, frequency = 440) {
  // Audio parameters
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * durationSecs;
  
  // Create buffer for WAV file
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);
  
  // Write WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4); // Chunk size
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // Byte rate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Generate sine wave
  for (let i = 0; i < numSamples; i++) {
    const amplitude = 32767; // Max amplitude for 16-bit audio
    const t = i / sampleRate;
    // Using a sine wave with varying frequency to make it more interesting
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    const offset = 44 + (i * (bitsPerSample / 8));
    buffer.writeInt16LE(Math.floor(sample), offset);
  }
  
  // Ensure directory exists
  const dirPath = path.join(__dirname, 'public', 'audio-samples');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
  
  // Write buffer to file
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath}`);
}

// Generate sample audio files for each sample transcription
function generateAllSamples() {
  generateAudioFile('sample1.wav', 5, 440); // A4
  generateAudioFile('sample2.wav', 7, 392); // G4
  generateAudioFile('sample3.wav', 6, 523); // C5
  generateAudioFile('sample4.wav', 10, 349); // F4
  generateAudioFile('sample5.wav', 9, 466); // A#4
  generateAudioFile('sample6.wav', 12, 330); // E4
  generateAudioFile('sample7.wav', 6, 587); // D5
  generateAudioFile('sample8.wav', 5, 494); // B4
  generateAudioFile('sample9.wav', 8, 415); // G#4
  generateAudioFile('sample10.wav', 10, 370); // F#4
  generateAudioFile('sample11.wav', 9, 554); // C#5
  generateAudioFile('sample12.wav', 7, 622); // D#5
  generateAudioFile('sample13.wav', 8, 294); // D4
  generateAudioFile('sample14.wav', 6, 440); // A4
  generateAudioFile('sample15.wav', 7, 349); // F4
  
  console.log('All sample audio files generated successfully!');
}

// Run the generator
generateAllSamples();