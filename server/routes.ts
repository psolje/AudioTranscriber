import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertTranscriptionResultSchema,
  insertTestSessionSchema,
  updateTestSessionSchema,
  insertAudioSampleSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { convertToMP3, isMP3, getAudioDuration } from "./audio-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static audio files from public/audio-samples
  app.use('/audio-samples', express.static(path.join('./public/audio-samples')));
  // Configure multer for audio file uploads
  const storage_dir = './public/audio-samples';
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(storage_dir)) {
    fs.mkdirSync(storage_dir, { recursive: true });
  }
  
  const audioStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, storage_dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage: audioStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      // Accept only audio files
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: fromZodError(error).message };
      }
      return { data: null, error: "Invalid request data" };
    }
  };

  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    const { data, error } = validateRequest(insertUserSchema, req.body);
    if (error) return res.status(400).json({ message: error });

    try {
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        const user = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          isAdmin: existingUser.isAdmin,
        };
        return res.status(200).json(user);
      }

      const newUser = await storage.createUser(data);
      const user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      };
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Admin login route
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    try {
      const user = await storage.verifyAdminCredentials(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });

  // Audio sample routes
  app.get("/api/audio-samples", async (_req: Request, res: Response) => {
    try {
      const samples = await storage.getAudioSamples();
      res.status(200).json(samples);
    } catch (error) {
      res.status(500).json({ message: "Error fetching audio samples" });
    }
  });

  app.get("/api/audio-samples/random", async (req: Request, res: Response) => {
    const count = parseInt(req.query.count as string) || 5;
    try {
      const samples = await storage.getRandomAudioSamples(count);
      res.status(200).json(samples);
    } catch (error) {
      res.status(500).json({ message: "Error fetching random audio samples" });
    }
  });

  // Test session routes
  app.post("/api/test-sessions", async (req: Request, res: Response) => {
    const { data, error } = validateRequest(insertTestSessionSchema, req.body);
    if (error) return res.status(400).json({ message: error });

    try {
      const session = await storage.createTestSession(data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Error creating test session" });
    }
  });

  app.get("/api/test-sessions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    try {
      const session = await storage.getTestSession(id);
      if (!session) {
        return res.status(404).json({ message: "Test session not found" });
      }
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ message: "Error fetching test session" });
    }
  });

  app.patch("/api/test-sessions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const { data, error } = validateRequest(updateTestSessionSchema, req.body);
    if (error) return res.status(400).json({ message: error });

    try {
      const session = await storage.updateTestSession(id, data);
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ message: "Error updating test session" });
    }
  });

  // Transcription result routes
  app.post("/api/transcription-results", async (req: Request, res: Response) => {
    const { data, error } = validateRequest(insertTranscriptionResultSchema, req.body);
    if (error) return res.status(400).json({ message: error });

    try {
      const result = await storage.createTranscriptionResult(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error creating transcription result" });
    }
  });

  app.get("/api/users/:userId/results", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      const results = await storage.getTranscriptionResultsByUserId(userId);
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user results" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/test-sessions", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const sessions = await storage.getAllTestSessions(limit, offset);
      const count = await storage.getTestSessionsCount();
      res.status(200).json({ sessions, count });
    } catch (error) {
      res.status(500).json({ message: "Error fetching test sessions" });
    }
  });

  app.get("/api/admin/test-sessions/filter", async (req: Request, res: Response) => {
    const name = req.query.name as string;
    const date = req.query.date as string;
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;

    try {
      const sessions = await storage.getTestSessionsByFilter({
        name,
        date,
        minScore,
      });
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error filtering test sessions" });
    }
  });

  app.get("/api/admin/test-sessions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    try {
      const session = await storage.getTestSessionWithResults(id);
      if (!session) {
        return res.status(404).json({ message: "Test session not found" });
      }
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ message: "Error fetching test session details" });
    }
  });

  // Admin audio sample management
  app.post("/api/admin/audio-samples", upload.single('audioFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const { title, transcript } = req.body;
      let { duration } = req.body;
      
      if (!title || !transcript) {
        return res.status(400).json({ 
          message: "Title and transcript are required" 
        });
      }

      // Get the full path to the uploaded file
      const originalFilePath = path.join('./public', 'audio-samples', req.file.filename);
      let finalFilePath = `audio-samples/${req.file.filename}`;
      let durationNum = 0;
      
      try {
        // Check if file is MP3, convert if not
        if (!isMP3(originalFilePath)) {
          console.log(`File ${req.file.filename} is not MP3. Converting...`);
          const convertedPath = await convertToMP3(originalFilePath);
          // Update the path to point to the MP3 file (relative path for storage)
          finalFilePath = `audio-samples/${path.basename(convertedPath)}`;
          console.log(`Converted to ${finalFilePath}`);
        }
        
        // Get the duration if not provided
        if (!duration) {
          const fullPath = path.join('./public', finalFilePath);
          durationNum = await getAudioDuration(fullPath);
          console.log(`Detected audio duration: ${durationNum} seconds`);
        } else {
          durationNum = parseInt(duration);
          if (isNaN(durationNum)) {
            // If duration is provided but invalid, detect it
            const fullPath = path.join('./public', finalFilePath);
            durationNum = await getAudioDuration(fullPath);
            console.log(`Invalid duration provided. Detected: ${durationNum} seconds`);
          }
        }
      } catch (conversionError: any) {
        console.error("Error processing audio file:", conversionError);
        return res.status(400).json({ 
          message: "Error processing audio file. Please upload an MP3 file.",
          error: conversionError.message
        });
      }
      
      // Create the audio sample in storage
      const audioSample = await storage.createAudioSample({
        title,
        path: finalFilePath,
        transcript,
        duration: durationNum
      });
      
      res.status(201).json({
        ...audioSample,
        convertedToMP3: finalFilePath !== `audio-samples/${req.file.filename}`
      });
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      res.status(500).json({ 
        message: "Error uploading audio sample",
        error: error.message 
      });
    }
  });

  // Delete audio sample
  app.delete("/api/admin/audio-samples/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid sample ID" });
    }

    try {
      const sample = await storage.getAudioSample(id);
      if (!sample) {
        return res.status(404).json({ message: "Audio sample not found" });
      }

      // Delete file from disk
      const filePath = path.join('./public', sample.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from storage
      await storage.deleteAudioSample(id);
      
      res.status(200).json({ message: "Audio sample deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting audio sample",
        error: (error as Error).message 
      });
    }
  });

  // Get admin credentials
  app.get("/api/admin/credentials", (_req: Request, res: Response) => {
    res.status(200).json({
      email: "admin@example.com",
      password: "admin123"
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
