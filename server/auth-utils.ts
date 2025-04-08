import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Promisify scrypt
const scryptAsync = promisify(scrypt);

/**
 * Hash a password with scrypt and a random salt
 * @param password Plain text password
 * @returns Hashed password with salt in format: 'hash.salt'
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a supplied password with a stored hash
 * @param supplied Supplied plain text password
 * @param stored Stored hash with salt
 * @returns True if passwords match
 */
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}