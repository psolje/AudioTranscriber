import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  password: text("password"), // Optional for regular users, required for admins
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  isAdmin: true,
  password: true,
});

// Audio sample model
export const audioSamples = pgTable("audio_samples", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  path: text("path").notNull(),
  transcript: text("transcript").notNull(),
  duration: integer("duration").notNull(), // Duration in seconds
});

export const insertAudioSampleSchema = createInsertSchema(audioSamples).pick({
  title: true,
  path: true,
  transcript: true,
  duration: true,
});

export const updateAudioSampleSchema = createInsertSchema(audioSamples).pick({
  title: true,
  transcript: true,
});

// Transcription test results model
export const transcriptionResults = pgTable("transcription_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sampleId: integer("sample_id").notNull(),
  sessionId: integer("session_id").notNull(),
  transcription: text("transcription").notNull(),
  accuracy: integer("accuracy").notNull(), // Percentage (0-100)
  wpm: integer("wpm").notNull(), // Words per minute
  timeTaken: integer("time_taken").notNull(), // Time in seconds
  testDate: timestamp("test_date").defaultNow().notNull(),
});

export const insertTranscriptionResultSchema = createInsertSchema(transcriptionResults).pick({
  userId: true,
  sampleId: true,
  sessionId: true,
  transcription: true,
  accuracy: true,
  wpm: true,
  timeTaken: true,
});

// Test session model
export const testSessions = pgTable("test_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testMode: text("test_mode").notNull(), // 'standard' or 'extended'
  sampleIds: json("sample_ids").$type<number[]>().notNull(), // Array of selected sample IDs
  avgAccuracy: integer("avg_accuracy"), // Percentage (0-100)
  avgWpm: integer("avg_wpm"), // Words per minute
  completed: boolean("completed").default(false).notNull(),
  testDate: timestamp("test_date").defaultNow().notNull(),
});

export const insertTestSessionSchema = createInsertSchema(testSessions).pick({
  userId: true,
  testMode: true,
  sampleIds: true,
});

export const updateTestSessionSchema = createInsertSchema(testSessions).pick({
  avgAccuracy: true,
  avgWpm: true,
  completed: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAudioSample = z.infer<typeof insertAudioSampleSchema>;
export type UpdateAudioSample = z.infer<typeof updateAudioSampleSchema>;
export type AudioSample = typeof audioSamples.$inferSelect;

export type InsertTranscriptionResult = z.infer<typeof insertTranscriptionResultSchema>;
export type TranscriptionResult = typeof transcriptionResults.$inferSelect;

export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;
export type UpdateTestSession = z.infer<typeof updateTestSessionSchema>;
export type TestSession = typeof testSessions.$inferSelect;

// Custom type for test result with calculated values
export type TestResultWithDetails = TranscriptionResult & {
  sampleTitle: string;
  sampleDuration: number;
};

// Custom type for test session with all results
export type TestSessionWithResults = TestSession & {
  user: {
    name: string;
    email: string;
  };
  results: TestResultWithDetails[];
};
