import { describe, it, expect } from 'vitest';
import { handleError, createErrorResponse } from '../src/utils/error-handler.js';

describe('handleError', () => {
  it('should return error message and stack when given an Error instance', () => {
    const error = new Error('Test error message');
    const result = handleError(error);

    expect(result.message).toBe('Test error message');
    expect(result.stack).toBeDefined();
    expect(result.stack).toContain('Test error message');
  });

  it('should return string representation when given a non-Error object', () => {
    const result = handleError('Simple string error');

    expect(result.message).toBe('Simple string error');
    expect(result.stack).toBeUndefined();
  });

  it('should convert number to string when given a number', () => {
    const result = handleError(404);

    expect(result.message).toBe('404');
    expect(result.stack).toBeUndefined();
  });

  it('should handle null value', () => {
    const result = handleError(null);

    expect(result.message).toBe('null');
    expect(result.stack).toBeUndefined();
  });

  it('should handle undefined value', () => {
    const result = handleError(undefined);

    expect(result.message).toBe('undefined');
    expect(result.stack).toBeUndefined();
  });

  it('should convert object to string', () => {
    const error = { code: 'ERR_001', detail: 'Something went wrong' };
    const result = handleError(error);

    expect(result.message).toBe('[object Object]');
    expect(result.stack).toBeUndefined();
  });
});

describe('createErrorResponse', () => {
  it('should create error response with Error instance', () => {
    const error = new Error('Test error');
    const response = createErrorResponse(error);

    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe('Test error');
    expect(parsed.stack).toBeDefined();
  });

  it('should create error response with custom message', () => {
    const error = new Error('Original error');
    const response = createErrorResponse(error, 'Custom prefix');

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error).toBe('Custom prefix: Original error');
  });

  it('should create error response without stack for non-Error values', () => {
    const response = createErrorResponse('Simple error message');

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe('Simple error message');
    expect(parsed.stack).toBeUndefined();
  });

  it('should format response as valid JSON', () => {
    const error = new Error('Test');
    const response = createErrorResponse(error);

    expect(() => JSON.parse(response.content[0].text)).not.toThrow();
  });

  it('should handle custom message with non-Error value', () => {
    const response = createErrorResponse('Network timeout', 'Connection failed');

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error).toBe('Connection failed: Network timeout');
  });
});
