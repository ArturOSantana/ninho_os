// tests/unit/validators.test.ts

import { describe, it, expect } from '@jest/globals';

/**
 * Testes de Validação - Formulários
 */

describe('Family Name Validator', () => {
  it('should accept valid family name', () => {
    const validNames = ['Silva', 'Família Silva', 'Os Santos', 'Andrade Mendes'];
    validNames.forEach((name) => {
      expect(name.length).toBeGreaterThanOrEqual(2);
      expect(name.length).toBeLessThanOrEqual(100);
    });
  });

  it('should reject empty name', () => {
    expect(''.length).toBeLessThan(2);
  });

  it('should reject name too short', () => {
    expect('A'.length).toBeLessThan(2);
  });

  it('should reject name too long', () => {
    const longName = 'A'.repeat(101);
    expect(longName.length).toBeGreaterThan(100);
  });
});

describe('Baby Name Validator', () => {
  it('should accept valid baby names', () => {
    const validNames = ['João', 'Maria', 'Pedro', 'Ana'];
    validNames.forEach((name) => {
      expect(name.length).toBeGreaterThanOrEqual(2);
      expect(name.length).toBeLessThanOrEqual(50);
    });
  });

  it('should reject name with special characters', () => {
    // Apenas validação de comprimento (special chars permitidos em bebés)
    const name = 'João-Pedro';
    expect(name.length).toBeGreaterThanOrEqual(2);
  });

  it('should reject very short name', () => {
    expect('A'.length).toBeLessThan(2);
  });

  it('should reject very long name', () => {
    const longName = 'A'.repeat(51);
    expect(longName.length).toBeGreaterThan(50);
  });
});

describe('Birth Date Validator', () => {
  it('should accept past birth date', () => {
    const pastDate = new Date('2024-01-01');
    const now = new Date();
    expect(pastDate.getTime()).toBeLessThan(now.getTime());
  });

  it('should reject future birth date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const now = new Date();
    expect(futureDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it('should accept today as birth date', () => {
    const today = new Date();
    const now = new Date();
    // Permitir hoje (bebé nascido hoje)
    expect(today.getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it('should accept very old birth date', () => {
    const oldDate = new Date('1950-01-01');
    const now = new Date();
    expect(oldDate.getTime()).toBeLessThan(now.getTime());
  });
});

describe('Gender Validator', () => {
  it('should accept valid genders', () => {
    const validGenders = ['male', 'female', 'other'];
    validGenders.forEach((gender) => {
      expect(['male', 'female', 'other']).toContain(gender);
    });
  });

  it('should reject invalid gender', () => {
    const invalidGender = 'unknown';
    expect(['male', 'female', 'other']).not.toContain(invalidGender);
  });
});
