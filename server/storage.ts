import {
  User,
  InsertUser,
  AudioSample,
  InsertAudioSample,
  TranscriptionResult,
  InsertTranscriptionResult,
  TestSession,
  InsertTestSession,
  UpdateTestSession,
  TestResultWithDetails,
  TestSessionWithResults,
} from "@shared/schema";
import fs from "fs";
import path from "path";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyAdminCredentials(email: string, password: string): Promise<User | undefined>;

  // Audio sample operations
  getAudioSamples(): Promise<AudioSample[]>;
  getAudioSample(id: number): Promise<AudioSample | undefined>;
  createAudioSample(sample: InsertAudioSample): Promise<AudioSample>;
  deleteAudioSample(id: number): Promise<void>;
  getRandomAudioSamples(count: number): Promise<AudioSample[]>;

  // Transcription result operations
  createTranscriptionResult(result: InsertTranscriptionResult): Promise<TranscriptionResult>;
  getTranscriptionResultsByUserId(userId: number): Promise<TranscriptionResult[]>;
  getTranscriptionResultsBySessionId(sessionId: number): Promise<TestResultWithDetails[]>;

  // Test session operations
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  getTestSession(id: number): Promise<TestSession | undefined>;
  getTestSessionsByUserId(userId: number): Promise<TestSession[]>;
  updateTestSession(id: number, updates: UpdateTestSession): Promise<TestSession>;
  getAllTestSessions(limit?: number, offset?: number): Promise<TestSessionWithResults[]>;
  getTestSessionWithResults(id: number): Promise<TestSessionWithResults | undefined>;
  getTestSessionsCount(): Promise<number>;
  getTestSessionsByFilter(filter: {
    name?: string;
    date?: string;
    minScore?: number;
  }): Promise<TestSessionWithResults[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private audioSamples: Map<number, AudioSample>;
  private transcriptionResults: Map<number, TranscriptionResult>;
  private testSessions: Map<number, TestSession>;
  private currentUserId: number;
  private currentSampleId: number;
  private currentResultId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.audioSamples = new Map();
    this.transcriptionResults = new Map();
    this.testSessions = new Map();
    this.currentUserId = 1;
    this.currentSampleId = 1;
    this.currentResultId = 1;
    this.currentSessionId = 1;

    // Create admin user
    this.createUser({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      isAdmin: true,
    });

    // Find and load existing audio files
    this.loadAudioSamplesFromFileSystem();
  }

  /**
   * Load audio samples from the file system
   * This ensures database only has entries for files that actually exist
   */
  private loadAudioSamplesFromFileSystem() {
    const audioSamplesDir = './public/audio-samples';
    const defaultTranscripts = {
      "default": "Please transcribe this audio sample as accurately as possible.",
    };
    
    if (!fs.existsSync(audioSamplesDir)) {
      console.log(`Audio samples directory not found: ${audioSamplesDir}`);
      return;
    }
    
    try {
      const files = fs.readdirSync(audioSamplesDir);
      
      // Only load .wav files (skip .gitkeep and other non-audio files)
      const audioFiles = files.filter(file => file.endsWith('.wav'));
      
      console.log(`Found ${audioFiles.length} audio files in ${audioSamplesDir}`);
      
      // Add each existing file to the database
      audioFiles.forEach(file => {
        // Extract filename without extension for use as title
        const title = file.replace('.wav', '');
        
        // Use a generic transcript
        const transcript = defaultTranscripts.default;
        
        // Default duration in seconds
        const duration = 5;
        
        this.createAudioSample({
          title: title,
          path: `/audio-samples/${file}`,
          transcript: transcript,
          duration: duration,
        });
      });
    } catch (error) {
      console.error("Error loading audio samples:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id, 
      name: insertUser.name,
      email: insertUser.email,
      isAdmin: insertUser.isAdmin || false,
      password: insertUser.password || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async verifyAdminCredentials(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (user && user.isAdmin && user.password === password) {
      return user;
    }
    return undefined;
  }

  // Audio sample operations
  async getAudioSamples(): Promise<AudioSample[]> {
    return Array.from(this.audioSamples.values());
  }

  async getAudioSample(id: number): Promise<AudioSample | undefined> {
    return this.audioSamples.get(id);
  }

  async createAudioSample(sample: InsertAudioSample): Promise<AudioSample> {
    const id = this.currentSampleId++;
    const audioSample: AudioSample = { ...sample, id };
    this.audioSamples.set(id, audioSample);
    return audioSample;
  }

  async deleteAudioSample(id: number): Promise<void> {
    if (!this.audioSamples.has(id)) {
      throw new Error(`Audio sample with ID ${id} not found`);
    }
    this.audioSamples.delete(id);
  }
  
  async getRandomAudioSamples(count: number): Promise<AudioSample[]> {
    const samples = Array.from(this.audioSamples.values());
    const shuffled = [...samples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Transcription result operations
  async createTranscriptionResult(result: InsertTranscriptionResult): Promise<TranscriptionResult> {
    const id = this.currentResultId++;
    const transcriptionResult: TranscriptionResult = { 
      ...result, 
      id, 
      testDate: new Date() 
    };
    this.transcriptionResults.set(id, transcriptionResult);
    return transcriptionResult;
  }

  async getTranscriptionResultsByUserId(userId: number): Promise<TranscriptionResult[]> {
    return Array.from(this.transcriptionResults.values()).filter(
      (result) => result.userId === userId,
    );
  }

  async getTranscriptionResultsBySessionId(sessionId: number): Promise<TestResultWithDetails[]> {
    const session = await this.getTestSession(sessionId);
    if (!session) return [];

    const results = Array.from(this.transcriptionResults.values()).filter(
      (result) => result.userId === session.userId && 
                 session.sampleIds.includes(result.sampleId)
    );

    return Promise.all(
      results.map(async (result) => {
        const sample = await this.getAudioSample(result.sampleId);
        return {
          ...result,
          sampleTitle: sample?.title || "Unknown Sample",
          sampleDuration: sample?.duration || 0,
        };
      })
    );
  }

  // Test session operations
  async createTestSession(session: InsertTestSession): Promise<TestSession> {
    const id = this.currentSessionId++;
    
    // Ensure sampleIds is properly converted to a number array
    let sampleIds: number[] = [];
    if (Array.isArray(session.sampleIds)) {
      sampleIds = session.sampleIds.map(id => typeof id === 'number' ? id : parseInt(id.toString()));
    }
    
    const testSession: TestSession = { 
      id,
      userId: session.userId,
      testMode: session.testMode,
      sampleIds: sampleIds,
      avgAccuracy: null, 
      avgWpm: null,
      completed: false,
      testDate: new Date() 
    };
    this.testSessions.set(id, testSession);
    return testSession;
  }

  async getTestSession(id: number): Promise<TestSession | undefined> {
    return this.testSessions.get(id);
  }

  async getTestSessionsByUserId(userId: number): Promise<TestSession[]> {
    return Array.from(this.testSessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async updateTestSession(id: number, updates: UpdateTestSession): Promise<TestSession> {
    const session = this.testSessions.get(id);
    if (!session) {
      throw new Error(`Test session with ID ${id} not found`);
    }

    const updatedSession = { ...session, ...updates };
    this.testSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getAllTestSessions(limit = 10, offset = 0): Promise<TestSessionWithResults[]> {
    const sessions = Array.from(this.testSessions.values())
      .sort((a, b) => b.testDate.getTime() - a.testDate.getTime())
      .slice(offset, offset + limit);

    return Promise.all(
      sessions.map(async (session) => {
        const user = await this.getUser(session.userId);
        const results = await this.getTranscriptionResultsBySessionId(session.id);
        
        return {
          ...session,
          user: {
            name: user?.name || "Unknown User",
            email: user?.email || "unknown@example.com",
          },
          results,
        };
      })
    );
  }

  async getTestSessionWithResults(id: number): Promise<TestSessionWithResults | undefined> {
    const session = this.testSessions.get(id);
    if (!session) return undefined;

    const user = await this.getUser(session.userId);
    const results = await this.getTranscriptionResultsBySessionId(id);
    
    return {
      ...session,
      user: {
        name: user?.name || "Unknown User",
        email: user?.email || "unknown@example.com",
      },
      results,
    };
  }

  async getTestSessionsCount(): Promise<number> {
    return this.testSessions.size;
  }

  async getTestSessionsByFilter(filter: {
    name?: string;
    date?: string;
    minScore?: number;
  }): Promise<TestSessionWithResults[]> {
    const sessions = await this.getAllTestSessions(100, 0); // Get all sessions with a large limit
    
    return sessions.filter(session => {
      // Filter by name if provided
      if (filter.name && !session.user.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }
      
      // Filter by date if provided
      if (filter.date) {
        const filterDate = new Date(filter.date);
        const sessionDate = new Date(session.testDate);
        
        if (filterDate.getFullYear() !== sessionDate.getFullYear() ||
            filterDate.getMonth() !== sessionDate.getMonth() ||
            filterDate.getDate() !== sessionDate.getDate()) {
          return false;
        }
      }
      
      // Filter by minimum score if provided
      if (filter.minScore && session.avgAccuracy && session.avgAccuracy < filter.minScore) {
        return false;
      }
      
      return true;
    });
  }
}

export const storage = new MemStorage();
