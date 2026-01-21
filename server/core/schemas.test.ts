import { describe, it, expect } from 'vitest';
import {
  AnalysisSchema,
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ConsentSchema,
  validate,
} from './schemas.js';

describe('Validation Schemas', () => {
  describe('AnalysisSchema', () => {
    it('should validate correct analysis input', () => {
      const data = {
        text: 'Vou construir 1000 escolas em todo o país',
        author: 'Candidato X',
        category: 'EDUCATION',
      };

      const result = validate(AnalysisSchema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe(data.text);
      }
    });

    it('should reject text shorter than 10 characters', () => {
      const data = {
        text: 'short',
        author: 'Candidato X',
      };

      const result = validate(AnalysisSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject text longer than 10000 characters', () => {
      const data = {
        text: 'a'.repeat(10001),
        author: 'Candidato X',
      };

      const result = validate(AnalysisSchema, data);

      expect(result.success).toBe(false);
    });

    it('should accept optional author and category', () => {
      const data = {
        text: 'Vou construir 1000 escolas em todo o país',
      };

      const result = validate(AnalysisSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const data = {
        text: 'Vou construir 1000 escolas em todo o país',
        category: 'INVALID_CATEGORY',
      };

      const result = validate(AnalysisSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should validate correct registration data', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'John Doe',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const data = {
        email: 'user@example.com',
        password: 'Short1!',
        name: 'John Doe',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const data = {
        email: 'user@example.com',
        password: 'lowercase123!',
        name: 'John Doe',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const data = {
        email: 'user@example.com',
        password: 'NoNumbers!',
        name: 'John Doe',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject name shorter than 2 characters', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'J',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };

      const result = validate(LoginSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      const result = validate(LoginSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const data = {
        email: 'user@example.com',
        password: '',
      };

      const result = validate(LoginSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('RefreshTokenSchema', () => {
    it('should validate correct refresh token', () => {
      const data = {
        refreshToken: 'valid-jwt-token-here',
      };

      const result = validate(RefreshTokenSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const data = {
        refreshToken: '',
      };

      const result = validate(RefreshTokenSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject missing refresh token', () => {
      const data = {};

      const result = validate(RefreshTokenSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('ConsentSchema', () => {
    it('should validate correct consent data', () => {
      const data = {
        dataProcessing: true,
        privacyPolicy: true,
      };

      const result = validate(ConsentSchema, data);

      expect(result.success).toBe(true);
    });

    it('should reject if dataProcessing is false', () => {
      const data = {
        dataProcessing: false,
        privacyPolicy: true,
      };

      const result = validate(ConsentSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject if privacyPolicy is false', () => {
      const data = {
        dataProcessing: true,
        privacyPolicy: false,
      };

      const result = validate(ConsentSchema, data);

      expect(result.success).toBe(false);
    });

    it('should reject if both are false', () => {
      const data = {
        dataProcessing: false,
        privacyPolicy: false,
      };

      const result = validate(ConsentSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should return meaningful error messages', () => {
      const data = {
        text: 'short',
        author: 'Candidato X',
      };

      const result = validate(AnalysisSchema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('mínimo');
      }
    });

    it('should handle multiple validation errors', () => {
      const data = {
        email: 'invalid',
        password: 'short',
        name: 'J',
      };

      const result = validate(RegisterSchema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });
});
