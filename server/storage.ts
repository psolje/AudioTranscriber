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

import { db } from "./db";
import { eq, like, and, gte, sql } from "drizzle-orm";
import { users, audioSamples, transcriptionResults, testSessions } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize database with required data
    this.initializeDatabase();
  }

  /**
   * Initialize the database with required data like admin user and audio samples
   */
  private async initializeDatabase() {
    try {
      // Check if admin user exists, create if not
      const adminUser = await this.getUserByEmail("admin@example.com");
      if (!adminUser) {
        await this.createUser({
          name: "Admin User",
          email: "admin@example.com",
          password: "admin123",
          isAdmin: true,
        });
        console.log("Created admin user");
      }

      // Load audio samples from the file system
      await this.loadAudioSamplesFromFileSystem();
    } catch (error) {
      console.error("Error initializing database:", error);
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
      const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));
      
      console.log(`Found ${audioFiles.length} audio files in ${audioSamplesDir}`);
      
      // Get existing audio samples
      const existingSamples = await this.getAudioSamples();
      const existingPaths = new Set(existingSamples.map(sample => sample.path));
      
      // Add each file to the database if it doesn't exist
      for (const file of audioFiles) {
        const path = `audio-samples/${file}`;
        
        // Skip if this file is already in the database
        if (existingPaths.has(path)) {
          continue;
        }
        
        // Extract filename without extension for use as title
        const title = file.replace(/\.(mp3|wav)$/, '');
        
        // Use a generic transcript
        const transcript = defaultTranscripts.default;
        
        // Default duration in seconds
        const duration = 5;
        
        await this.createAudioSample({
          title: title,
          path: path,
          transcript: transcript,
          duration: duration,
        });
        
        console.log(`Added audio sample: ${title}`);
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(sql`LOWER(${users.email})`, email.toLowerCase()));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
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
    return db.select().from(audioSamples);
  }

  async getAudioSample(id: number): Promise<AudioSample | undefined> {
    const [sample] = await db
      .select()
      .from(audioSamples)
      .where(eq(audioSamples.id, id));
    return sample;
  }

  async createAudioSample(sample: InsertAudioSample): Promise<AudioSample> {
    const [newSample] = await db
      .insert(audioSamples)
      .values(sample)
      .returning();
    return newSample;
  }

  async updateAudioSample(id: number, updates: UpdateAudioSample): Promise<AudioSample> {
    const [updatedSample] = await db
      .update(audioSamples)
      .set(updates)
      .where(eq(audioSamples.id, id))
      .returning();
    
    if (!updatedSample) {
      throw new Error(`Audio sample with ID ${id} not found`);
    }
    
    return updatedSample;
  }

  async deleteAudioSample(id: number): Promise<void> {
    const result = await db
      .delete(audioSamples)
      .where(eq(audioSamples.id, id))
      .returning({ id: audioSamples.id });
    
    if (result.length === 0) {
      throw new Error(`Audio sample with ID ${id} not found`);
    }
  }
  
  async getRandomAudioSamples(count: number): Promise<AudioSample[]> {
    // PostgreSQL's RANDOM() function for random ordering
    const samples = await db
      .select()
      .from(audioSamples)
      .orderBy(sql`RANDOM()`)
      .limit(count);
    
    return samples;
  }

  // Transcription result operations
  async createTranscriptionResult(result: InsertTranscriptionResult): Promise<TranscriptionResult> {
    const [newResult] = await db
      .insert(transcriptionResults)
      .values({
        userId: result.userId,
        sampleId: result.sampleId,
        sessionId: result.sessionId,
        transcription: result.transcription,
        accuracy: result.accuracy,
        wpm: result.wpm,
        timeTaken: result.timeTaken
      })
      .returning();
    return newResult;
  }

  async getTranscriptionResultsByUserId(userId: number): Promise<TranscriptionResult[]> {
    return db
      .select()
      .from(transcriptionResults)
      .where(eq(transcriptionResults.userId, userId));
  }

  async getTranscriptionResultsBySessionId(sessionId: number): Promise<TestResultWithDetails[]> {
    const session = await this.getTestSession(sessionId);
    if (!session) return [];

    const results = await db.select()
      .from(transcriptionResults)
      .where(eq(transcriptionResults.sessionId, sessionId));

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
    // Use the pg Pool directly to avoid Drizzle ORM type issues with JSON
    const query = `
      INSERT INTO test_sessions (user_id, test_mode, sample_ids)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      session.userId,
      session.testMode,
      JSON.stringify(Array.isArray(session.sampleIds) ? session.sampleIds : [])
    ];
    
    // Use the executeQuery function from db.ts
    const { executeQuery } = await import('./db');
    const result = await executeQuery(query, values);
    return result.rows[0] as TestSession;
  }

  async getTestSession(id: number): Promise<TestSession | undefined> {
    const [session] = await db
      .select()
      .from(testSessions)
      .where(eq(testSessions.id, id));
    
    return session;
  }

  async getTestSessionsByUserId(userId: number): Promise<TestSession[]> {
    return db
      .select()
      .from(testSessions)
      .where(eq(testSessions.userId, userId));
  }

  async updateTestSession(id: number, updates: UpdateTestSession): Promise<TestSession> {
    const [updatedSession] = await db
      .update(testSessions)
      .set(updates)
      .where(eq(testSessions.id, id))
      .returning();
    
    if (!updatedSession) {
      throw new Error(`Test session with ID ${id} not found`);
    }
    
    return updatedSession;
  }

  async getAllTestSessions(limit = 10, offset = 0): Promise<TestSessionWithResults[]> {
    // Get sessions with pagination
    const sessions = await db
      .select()
      .from(testSessions)
      .orderBy(sql`${testSessions.testDate} DESC`)
      .limit(limit)
      .offset(offset);

    // Fetch additional data for each session
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
    const session = await this.getTestSession(id);
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
    const [result] = await db
      .select({ count: sql`COUNT(*)` })
      .from(testSessions);
    
    return Number(result?.count || 0);
  }

  async getTestSessionsByFilter(filter: {
    name?: string;
    date?: string;
    minScore?: number;
  }): Promise<TestSessionWithResults[]> {
    // Build filter conditions for SQL query
    let conditions = [];
    let params: any[] = [];
    let paramIndex = 1;
    
    // Handle name filter
    if (filter.name) {
      const nameFilter = `%${filter.name.toLowerCase()}%`;
      conditions.push(`EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = test_sessions.user_id 
        AND LOWER(users.name) LIKE $${paramIndex}
      )`);
      params.push(nameFilter);
      paramIndex++;
    }
    
    // Handle date filter
    if (filter.date) {
      const date = new Date(filter.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      conditions.push(`test_date >= $${paramIndex} AND test_date < $${paramIndex + 1}`);
      params.push(date, nextDay);
      paramIndex += 2;
    }
    
    // Handle minimum score filter
    if (filter.minScore) {
      conditions.push(`avg_accuracy IS NOT NULL AND avg_accuracy >= $${paramIndex}`);
      params.push(filter.minScore);
      paramIndex++;
    }
    
    // Build and execute the query
    let query = `
      SELECT * FROM test_sessions
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY test_date DESC
    `;
    
    // Use the executeQuery function from db.ts
    const { executeQuery } = await import('./db');
    const result = await executeQuery(query, params);
    const sessions = result.rows as TestSession[];
    
    // Fetch additional data for each session
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
}

export const storage = new DatabaseStorage();
