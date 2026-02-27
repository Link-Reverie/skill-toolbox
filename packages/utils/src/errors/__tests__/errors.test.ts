import { describe, it, expect } from 'vitest';
import {
  SkillToolboxError,
  ParseError,
  ValidationError,
  PluginError,
  NotFoundError
} from '../index';

describe('Error Classes', () => {
  it('should create SkillToolboxError', () => {
    const error = new SkillToolboxError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('SkillToolboxError');
  });

  it('should create ParseError with details', () => {
    const error = new ParseError('Parse failed', { line: 10, column: 5 });
    expect(error.message).toBe('Parse failed');
    expect(error.code).toBe('PARSE_ERROR');
    expect(error.details).toEqual({ line: 10, column: 5 });
  });

  it('should create ValidationError with errors array', () => {
    const errors = [
      { field: 'name', message: 'Required' },
      { field: 'version', message: 'Invalid format' }
    ];
    const error = new ValidationError('Validation failed', errors);
    expect(error.errors).toHaveLength(2);
    expect(error.errors[0].field).toBe('name');
  });

  it('should create PluginError with plugin name', () => {
    const error = new PluginError('metadata', 'Failed to parse');
    expect(error.message).toContain('metadata');
    expect(error.message).toContain('Failed to parse');
  });

  it('should create NotFoundError', () => {
    const error = new NotFoundError('brainstorming', 'skill');
    expect(error.message).toContain('brainstorming');
    expect(error.message).toContain('skill');
    expect(error.code).toBe('NOT_FOUND');
  });
});
