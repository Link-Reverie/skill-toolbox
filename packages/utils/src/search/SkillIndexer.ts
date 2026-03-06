import type { Skill, SkillMetadata } from '../types/skill';

/**
 * Skill search result
 */
export interface SkillSearchResult {
  name: string;
  description: string;
  keywords: string[];
  path: string;
  relevanceScore: number;
}

/**
 * Fast keyword-based skill indexer and searcher
 *
 * This provides the search capability that Agent actually needs
 * for finding relevant skills based on user queries.
 */
export class SkillIndexer {
  private skills: Map<string, {
    metadata: SkillMetadata;
    raw: string;
    keywords: string[];
  }>;

  constructor(skills: Map<string, Skill>) {
    this.skills = new Map(
      Array.from(skills.entries()).map(([name, skill]) => [
        name,
        {
          metadata: skill.metadata,
          raw: skill.raw.markdown,
          keywords: this.extractKeywords(skill)
        }
      ])
    );
  }

  /**
   * Search skills by query
   * Uses fast keyword matching (not AI-powered, but good enough for most cases)
   */
  search(query: string): SkillSearchResult[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const results: SkillSearchResult[] = [];

    for (const [name, { metadata, raw, keywords }] of this.skills) {
      let score = 0;

      // 1. Exact name match (highest priority)
      if (name.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // 2. Description match
      const desc = metadata.description?.toLowerCase() || '';
      if (desc.includes(queryLower)) {
        score += 5;
      }

      // 3. Keyword matches
      for (const keyword of keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 3;
        }
      }

      // 4. Query words in raw content
      for (const word of queryWords) {
        if (raw.toLowerCase().includes(word)) {
          score += 1;
        }
      }

      // 5. Tag matches (if available)
      const tags = metadata.tags || [];
      for (const tag of tags) {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 4;
        }
      }

      if (score > 0) {
        results.push({
          name,
          description: metadata.description || 'No description',
          keywords,
          path: '', // Will be filled by caller if needed
          relevanceScore: score
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get raw markdown content for a skill
   * This is what LLM actually consumes when reading skill details
   */
  getRawContent(name: string): string | undefined {
    return this.skills.get(name)?.raw;
  }

  /**
   * Get skill metadata (for listing)
   */
  getMetadata(name: string): SkillMetadata | undefined {
    return this.skills.get(name)?.metadata;
  }

  /**
   * List all skills with basic info
   */
  listAll(): Array<{ name: string; description: string }> {
    return Array.from(this.skills.entries()).map(([name, { metadata }]) => ({
      name,
      description: metadata.description || 'No description'
    }));
  }

  /**
   * Extract keywords from skill for indexing
   */
  private extractKeywords(skill: Skill): string[] {
    const keywords = new Set<string>();

    // From metadata
    if (skill.metadata.tags) {
      skill.metadata.tags.forEach(tag => keywords.add(tag));
    }
    if (skill.metadata.keywords) {
      skill.metadata.keywords.forEach(kw => keywords.add(kw));
    }

    // From name
    const nameParts = skill.metadata.name.split(/[-_]/);
    nameParts.forEach(part => {
      if (part.length > 2) keywords.add(part.toLowerCase());
    });

    return Array.from(keywords);
  }
}
