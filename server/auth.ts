import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { comparePasswords, hashPassword } from "./auth-utils";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const PostgresSessionStore = connectPg(session);

/**
 * Set up authentication for the Express app
 * @param app Express application
 */
export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'transcription-tool-secret',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
    }, async (email, password, done) => {
      try {
        // Dynamically import storage to avoid circular dependencies
        const { storage } = await import('./storage');
        const user = await storage.getUserByEmail(email);
        
        if (!user || !user.password) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize user ID to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session user ID
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Dynamically import storage to avoid circular dependencies
      const { storage } = await import('./storage');
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register endpoint for creating a regular user (no password required)
  app.post("/api/register", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      // Dynamically import storage to avoid circular dependencies
      const { storage } = await import('./storage');
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
      
      // Create regular user (no password required)
      const user = await storage.createUser({
        email,
        name,
        isAdmin: false,
      });
      
      // Log the user in automatically
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Admin registration endpoint (requires password)
  app.post("/api/admin/register", async (req, res) => {
    try {
      const { email, name, password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required for admin" });
      }
      
      // Dynamically import storage to avoid circular dependencies
      const { storage } = await import('./storage');
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
      
      // Create admin user with hashed password
      const user = await storage.createUser({
        email,
        name,
        isAdmin: true,
        password: await hashPassword(password),
      });
      
      // Admin created successfully but not logged in automatically
      return res.status(201).json({ message: "Admin created successfully" });
    } catch (error) {
      console.error("Admin registration error:", error);
      res.status(500).json({ error: "Failed to register admin" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Admin authentication middleware
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  });
}

// Helper function to check if user is authenticated
export function isAuthenticated(req: Express.Request) {
  return req.isAuthenticated();
}

// Helper function to check if user is an admin
export function isAdmin(req: Express.Request) {
  return req.isAuthenticated() && req.user.isAdmin;
}