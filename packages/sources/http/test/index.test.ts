import { describe, it, expect } from 'vitest';
import { HttpSource } from '../src/index';

describe('HttpSource', () => {
  it('should return correct source info', () => {
    const source = new HttpSource({
      url: 'https://example.com/skills/',
    });

    const info = source.getSourceInfo();
    expect(info.type).toBe('git');
    expect(info.identifier).toBe('http:example.com');
  });

  it('should normalize URL to end with slash', () => {
    const source1 = new HttpSource({ url: 'https://example.com/skills' });
    const source2 = new HttpSource({ url: 'https://example.com/skills/' });

    expect(source1.getSourceInfo()).toEqual(source2.getSourceInfo());
  });
});
