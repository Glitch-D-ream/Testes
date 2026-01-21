import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateJWT,
  verifyJWT,
  generateRefreshToken,
  verifyRefreshToken,
  extractTokenFromHeader,
} from './auth.js';

describe('Authentication Module', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should compare password with hash correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const token = generateJWT(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should verify a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const token = generateJWT(payload);
      const verified = verifyJWT(token);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe(payload.role);
    });

    it('should return null for invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyJWT(invalidToken);

      expect(verified).toBeNull();
    });

    it('should return null for tampered JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const token = generateJWT(payload);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      const verified = verifyJWT(tamperedToken);

      expect(verified).toBeNull();
    });
  });

  describe('Refresh Tokens', () => {
    it('should generate a refresh token', () => {
      const userId = 'user-123';
      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should verify a valid refresh token', () => {
      const userId = 'user-123';
      const token = generateRefreshToken(userId);
      const verified = verifyRefreshToken(token);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(userId);
    });

    it('should return null for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyRefreshToken(invalidToken);

      expect(verified).toBeNull();
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from Bearer header', () => {
      const token = 'my-jwt-token-here';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const extracted1 = extractTokenFromHeader('InvalidFormat token');
      const extracted2 = extractTokenFromHeader('Bearer');
      const extracted3 = extractTokenFromHeader('Bearer token extra');

      expect(extracted1).toBeNull();
      expect(extracted2).toBeNull();
      expect(extracted3).toBeNull();
    });

    it('should return null for empty Bearer token', () => {
      const extracted = extractTokenFromHeader('Bearer ');

      expect(extracted).toBeNull();
    });
  });
});
