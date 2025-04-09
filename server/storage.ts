import {
  User,
  InsertUser,
  AudioSample,
  InsertAudioSample,
  UpdateAudioSample,
  TranscriptionResult,
  InsertTranscriptionResult,
  TestSession,
  InsertTestSession,
  UpdateTestSession,
  TestResultWithDetails,
  TestSessionWithResults,
  users,
  audioSamples,
  transcriptionResults,
  testSessions,
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { db } from './db';
import { eq, like, lte, desc, sql, asc, gte } from 'drizzle-orm';
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { pool } from './db';

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyAdminCredentials(email: string, password: string): Promise<User | undefined>;

  // Audio sample operations
  getAudioSamples(): Promise<AudioSample[]>;
  getAudioSample(id: number): Promise<AudioSample | undefined>;
  createAudioSample(sample: InsertAudioSample): Promise<AudioSample>;
  updateAudioSample(id: number, updates: UpdateAudioSample): Promise<AudioSample>;
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

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PgSessionStore = connectPgSimple(session);
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Create admin user if not exists
    this.ensureAdminExists();
    
    // Load existing audio files if any
    this.loadAudioSamplesFromFileSystem();
  }

  private async ensureAdminExists() {
    try {
      const adminUser = await this.getUserByEmail('admin@example.com');
      if (!adminUser) {
        await this.createUser({
          name: "Admin User",
          email: "admin@example.com",
          password: "admin123",
          isAdmin: true,
        });
        console.log('Admin user created');
      }
    } catch (error) {
      console.error('Error ensuring admin exists:', error);
    }
  }

  /**
   * Load audio samples from the file system
   * This ensures database only has entries for files that actually exist
   */
  private async loadAudioSamplesFromFileSystem() {
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
      
      // Load audio files (mp3 and wav)
      const audioFiles = files.filter(file => 
        (file.endsWith('.mp3') || file.endsWith('.wav')) && 
        !file.startsWith('.')
      );
      
      console.log(`Found ${audioFiles.length} audio files in ${audioSamplesDir}`);
      
      // Get existing audio files from the database
      const existingSamples = await db.select({ path: audioSamples.path }).from(audioSamples);
      const existingPaths = new Set(existingSamples.map(s => s.path));
      
      // Add each new file to the database
      for (const file of audioFiles) {
        const filePath = `audio-samples/${file}`;
        if (!existingPaths.has(filePath)) {
          // Extract filename without extension for use as title
          const title = file.replace(/\.(mp3|wav)$/, '');
          
          // Use a generic transcript
          const transcript = defaultTranscripts.default;
          
          // Default duration in seconds
          const duration = 5;
          
          await this.createAudioSample({
            title: title,
            path: filePath,
            transcript: transcript,
            duration: duration,
          });
          console.log(`Added new audio sample: ${title}`);
        }
      }
    } catch (error) {
      console.error("Error loading audio samples:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase()
    }).returning();
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
    return await db.select().from(audioSamples).orderBy(asc(audioSamples.title));
  }

  async getAudioSample(id: number): Promise<AudioSample | undefined> {
    const [sample] = await db.select().from(audioSamples).where(eq(audioSamples.id, id));
    return sample;
  }

  async createAudioSample(sample: InsertAudioSample): Promise<AudioSample> {
    const [audioSample] = await db.insert(audioSamples).values(sample).returning();
    return audioSample;
  }

  async updateAudioSample(id: number, updates: UpdateAudioSample): Promise<AudioSample> {
    const [updated] = await db
      .update(audioSamples)
      .set(updates)
      .where(eq(audioSamples.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Audio sample with ID ${id} not found`);
    }
    
    return updated;
  }

  async deleteAudioSample(id: number): Promise<void> {
    const [sample] = await db.select({ path: audioSamples.path })
      .from(audioSamples)
      .where(eq(audioSamples.id, id));
    
    if (!sample) {
      throw new Error(`Audio sample with ID ${id} not found`);
    }
    
    await db.delete(audioSamples).where(eq(audioSamples.id, id));
    
    // Also delete the physical file if it exists
    const filePath = `./public/${sample.path}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  async getRandomAudioSamples(count: number): Promise<AudioSample[]> {
    // PostgreSQL-specific random selection
    const samples = await db.select()
      .from(audioSamples)
      .orderBy(sql`RANDOM()`)
      .limit(count);
    
    return samples;
  }

  // Transcription result operations
  async createTranscriptionResult(result: InsertTranscriptionResult): Promise<TranscriptionResult> {
    const [transcriptionResult] = await db
      .insert(transcriptionResults)
      .values(result)
      .returning();
    
    return transcriptionResult;
  }

  async getTranscriptionResultsByUserId(userId: number): Promise<TranscriptionResult[]> {
    return await db
      .select()
      .from(transcriptionResults)
      .where(eq(transcriptionResults.userId, userId))
      .orderBy(desc(transcriptionResults.testDate));
  }

  async getTranscriptionResultsBySessionId(sessionId: number): Promise<TestResultWithDetails[]> {
    const session = await this.getTestSession(sessionId);
    if (!session) return [];

    const sampleIds = Array.isArray(session.sampleIds) 
      ? session.sampleIds 
      : JSON.parse(session.sampleIds as string);

    const results = await db
      .select()
      .from(transcriptionResults)
      .where(eq(transcriptionResults.sessionId, sessionId));

    const resultDetails: TestResultWithDetails[] = [];
    
    for (const result of results) {
      const [sample] = await db
        .select()
        .from(audioSamples)
        .where(eq(audioSamples.id, result.sampleId));
      
      resultDetails.push({
        ...result,
        sampleTitle: sample?.title || "Unknown Sample",
        sampleDuration: sample?.duration || 0,
      });
    }
    
    return resultDetails;
  }

  // Test session operations
  async createTestSession(session: InsertTestSession): Promise<TestSession> {
    // Ensure sampleIds is properly formatted for JSON storage
    let sampleIdsValue = session.sampleIds;
    if (typeof sampleIdsValue !== 'string') {
      sampleIdsValue = JSON.stringify(sampleIdsValue);
    }
    
    const [testSession] = await db
      .insert(testSessions)
      .values({
        ...session,
        sampleIds: sampleIdsValue
      })
      .returning();
    
    return testSession;
  }

  async getTestSession(id: number): Promise<TestSession | undefined> {
    const [session] = await db
      .select()
      .from(testSessions)
      .where(eq(testSessions.id, id));
    
    return session;
  }

  async getTestSessionsByUserId(userId: number): Promise<TestSession[]> {
    return await db
      .select()
      .from(testSessions)
      .where(eq(testSessions.userId, userId))
      .orderBy(desc(testSessions.testDate));
  }

  async updateTestSession(id: number, updates: UpdateTestSession): Promise<TestSession> {
    const [updated] = await db
      .update(testSessions)
      .set(updates)
      .where(eq(testSessions.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Test session with ID ${id} not found`);
    }
    
    return updated;
  }

  async getAllTestSessions(limit = 10, offset = 0): Promise<TestSessionWithResults[]> {
    const sessions = await db
      .select()
      .from(testSessions)
      .orderBy(desc(testSessions.testDate))
      .limit(limit)
      .offset(offset);
    
    const sessionsWithResults: TestSessionWithResults[] = [];
    
    for (const session of sessions) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));
      
      const results = await this.getTranscriptionResultsBySessionId(session.id);
      
      sessionsWithResults.push({
        ...session,
        user: {
          name: user?.name || "Unknown User",
          email: user?.email || "unknown@example.com",
        },
        results,
      });
    }
    
    return sessionsWithResults;
  }

  async getTestSessionWithResults(id: number): Promise<TestSessionWithResults | undefined> {
    const session = await this.getTestSession(id);
    if (!session) return undefined;
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));
    
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
    const [result] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(testSessions);
    
    return result?.count || 0;
  }

  async getTestSessionsByFilter(filter: {
    name?: string;
    date?: string;
    minScore?: number;
  }): Promise<TestSessionWithResults[]> {
    let query = db.select().from(testSessions);
    
    if (filter.minScore) {
      query = query.where(gte(testSessions.avgAccuracy, filter.minScore));
    }
    
    if (filter.date) {
      const filterDate = new Date(filter.date);
      // Create start of day and end of day for the date
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        sql`${testSessions.testDate} >= ${startOfDay} AND ${testSessions.testDate} <= ${endOfDay}`
      );
    }
    
    const sessions = await query.orderBy(desc(testSessions.testDate));
    
    // For name filtering, we need to get all users and then filter
    let filteredSessions = [...sessions];
    
    if (filter.name) {
      const sessionsWithResults: TestSessionWithResults[] = [];
      
      for (const session of sessions) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, session.userId));
        
        if (user && user.name.toLowerCase().includes(filter.name.toLowerCase())) {
          const results = await this.getTranscriptionResultsBySessionId(session.id);
          
          sessionsWithResults.push({
            ...session,
            user: {
              name: user.name,
              email: user.email,
            },
            results,
          });
        }
      }
      
      return sessionsWithResults;
    }
    
    // If no name filter, get all sessions with results
    return await this.getAllTestSessions(100, 0);
  }
}

export const storage = new DatabaseStorage();
