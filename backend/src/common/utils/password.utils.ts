import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Utility class for secure password hashing and verification.
 * Uses bcrypt with 12 salt rounds for strong, industry-standard password hashing.
 */
export class PasswordUtils {
  /**
   * Hash a plaintext password using bcrypt.
   * @param plaintext - The plaintext password to hash.
   * @returns The bcrypt hash string.
   */
  static async hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
  }

  /**
   * Verify a plaintext password against a bcrypt hash.
   * Also supports legacy plaintext comparison for migration period.
   * @param plaintext - The plaintext password to verify.
   * @param storedPassword - The stored password (hash or legacy plaintext).
   * @returns True if the password matches.
   */
  static async verifyPassword(
    plaintext: string,
    storedPassword: string,
  ): Promise<boolean> {
    // If the stored password is a bcrypt hash, use bcrypt comparison
    if (PasswordUtils.isHashed(storedPassword)) {
      return bcrypt.compare(plaintext, storedPassword);
    }

    // Legacy plaintext comparison (for unmigrated passwords)
    // Uses timing-safe comparison to prevent timing attacks
    const { timingSafeEqual } = await import('crypto');
    const leftBuffer = Buffer.from(plaintext);
    const rightBuffer = Buffer.from(storedPassword);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  /**
   * Check if a password string is already a bcrypt hash.
   * Bcrypt hashes start with $2a$ or $2b$ followed by the cost factor.
   * @param password - The password string to check.
   * @returns True if the password is already a bcrypt hash.
   */
  static isHashed(password: string): boolean {
    return /^\$2[aby]?\$\d{1,2}\$/.test(password);
  }

  /**
   * Generate a secure random password.
   * @param length - The length of the password (default: 10).
   * @returns A random password string.
   */
  static generateSecurePassword(length: number = 10): string {
    const { randomBytes } = require('crypto') as typeof import('crypto');
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    const bytes = randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  }
}
