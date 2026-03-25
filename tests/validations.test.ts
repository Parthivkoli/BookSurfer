// tests/validations.test.ts
import { contactFormSchema, signupFormSchema, loginFormSchema } from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('contactFormSchema', () => {
    test('should accept valid contact data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a valid message for testing purposes.',
      };
      const result = contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'john@example.com',
        message: 'Valid message',
      };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        name: 'John',
        email: 'not-an-email',
        message: 'Valid message',
      };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject short message', () => {
      const invalidData = {
        name: 'John',
        email: 'john@example.com',
        message: 'Short',
      };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('signupFormSchema', () => {
    test('should accept valid signup data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      };
      const result = signupFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject weak password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };
      const result = signupFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'ValidPass123',
        confirmPassword: 'DifferentPass123',
      };
      const result = signupFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginFormSchema', () => {
    test('should accept valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
      };
      const result = loginFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'anypassword',
      };
      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };
      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
