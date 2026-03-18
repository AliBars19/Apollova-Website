import { describe, it, expect } from 'vitest';
import { generateLicenseKey, generateId } from '../database';

describe('generateLicenseKey', () => {
  it('returns XXXX-XXXX-XXXX-XXXX format', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('uses only allowed characters', () => {
    const allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const key = generateLicenseKey();
    const chars = key.replace(/-/g, '');
    for (const c of chars) {
      expect(allowed).toContain(c);
    }
  });

  it('generates unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(generateLicenseKey());
    }
    expect(keys.size).toBe(50);
  });

  it('has exactly 4 segments', () => {
    const key = generateLicenseKey();
    const segments = key.split('-');
    expect(segments).toHaveLength(4);
  });

  it('each segment has 4 characters', () => {
    const key = generateLicenseKey();
    const segments = key.split('-');
    for (const seg of segments) {
      expect(seg).toHaveLength(4);
    }
  });
});

describe('generateId', () => {
  it('returns non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(50);
  });

  it('returns alphanumeric string', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('has sufficient length', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThanOrEqual(10);
  });
});
