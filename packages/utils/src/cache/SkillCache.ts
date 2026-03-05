import type { SkillMetadata } from '../types/skill';

/**
 * Simple in-memory cache for skill content
 *
 * Caches raw markdown content for fast access when LLM reads skill details
 */
export class SkillCache {
  private cache: Map<string, {
    content: string;
    metadata: SkillMetadata;
    timestamp: number;
    path?: string;
  }> = new Map();

  /**
   * Cache a skill's content and metadata
   */
  set(name: string, content: string, metadata: SkillMetadata, path?: string): void {
    this.cache.set(name, {
      content,
      metadata,
      timestamp: Date.now(),
      path
    });
  }

  /**
   * Get cached raw content
   */
  get(name: string): string | undefined {
    return this.cache.get(name)?.content;
  }

  /**
   * Get cached metadata
   */
  getMetadata(name: string): SkillMetadata | undefined {
    return this.cache.get(name)?.metadata;
  }

  /**
   * Get cached path
   */
  getPath(name: string): string | undefined {
    return this.cache.get(name)?.path;
  }

  /**
   * Check if skill is cached
   */
  has(name: string): boolean {
    return this.cache.has(name);
  }

  /**
   * Get all cached skill names
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (number of skills)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  stats(): {
    count: number;
    totalSize: number;
    avgSize: number;
  } {
    let totalSize = 0;
    for (const { content } of this.cache.values()) {
      totalSize += content.length;
    }

    return {
      count: this.cache.size,
      totalSize,
      avgSize: this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0
    };
  }
}
