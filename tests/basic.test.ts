import { describe, it, expect } from 'vitest';

describe('Basic Math Operations', () => {
  it('should add two numbers correctly', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });

  it('should multiply two numbers correctly', () => {
    const result = 3 * 4;
    expect(result).toBe(12);
  });
});
