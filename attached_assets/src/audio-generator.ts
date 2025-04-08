import fs from 'fs';
import path from 'path';

/**
 * Generate a simple sine wave audio file
 * @param filename Filename to save
 * @param durationSecs Duration in seconds
 * @param frequency Frequency in Hz
 */
async function generateAudioFile(filename: string, durationSecs: number, frequency: number = 440): Promise<void> {
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
  
  // Write buffer to file
  const filePath = path.join(process.cwd(), 'public', 'audio-samples', filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath}`);
}

// Generate sample audio files for each sample transcription
async function generateAllSamples() {
  await generateAudioFile('sample1.mp3', 5, 440); // A4
  await generateAudioFile('sample2.mp3', 7, 392); // G4
  await generateAudioFile('sample3.mp3', 6, 523); // C5
  await generateAudioFile('sample4.mp3', 10, 349); // F4
  await generateAudioFile('sample5.mp3', 9, 466); // A#4
  await generateAudioFile('sample6.mp3', 12, 330); // E4
  await generateAudioFile('sample7.mp3', 6, 587); // D5
  await generateAudioFile('sample8.mp3', 5, 494); // B4
  await generateAudioFile('sample9.mp3', 8, 415); // G#4
  await generateAudioFile('sample10.mp3', 10, 370); // F#4
  await generateAudioFile('sample11.mp3', 9, 554); // C#5
  await generateAudioFile('sample12.mp3', 7, 622); // D#5
  await generateAudioFile('sample13.mp3', 8, 294); // D4
  await generateAudioFile('sample14.mp3', 6, 440); // A4
  await generateAudioFile('sample15.mp3', 7, 349); // F4
  
  console.log('All sample audio files generated successfully!');
}

generateAllSamples().catch(console.error);