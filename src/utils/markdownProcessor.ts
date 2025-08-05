// src/utils/markdownProcessor.ts
import { remark } from 'remark';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { selectAll } from 'unist-util-select';
import type { Root, Content, Text, Heading, Paragraph, Code, InlineCode } from 'mdast';

export interface MarkdownMetadata {
  abstract: string;
  headings: { level: number; text: string; id: string }[];
  tags: string[];
  readingTime: number;
  complexity: 'Low' | 'Medium' | 'High';
  wordCount: number;
  codeBlocks: number;
  hasImplementation: boolean;
  dependencies: string[];
  replaces: string[];
  supersededBy: string[];
}

export interface TableOfContents {
  id: string;
  text: string;
  level: number;
  children: TableOfContents[];
}

class MarkdownProcessor {
  private processor;

  constructor() {
    this.processor = remark()
      .use(remarkParse)
      .use(remarkGfm);
  }

  /**
   * Parse markdown content and extract comprehensive metadata
   */
  analyzeMarkdown(content: string): MarkdownMetadata {
    const tree = this.processor.parse(content);
    
    return {
      abstract: this.extractAbstract(tree),
      headings: this.extractHeadings(tree),
      tags: this.extractTags(tree),
      readingTime: this.calculateReadingTime(tree),
      complexity: this.assessComplexity(tree),
      wordCount: this.countWords(tree),
      codeBlocks: this.countCodeBlocks(tree),
      hasImplementation: this.hasImplementationSection(tree),
      dependencies: this.extractDependencies(tree),
      replaces: this.extractReplaces(tree),
      supersededBy: this.extractSupersededBy(tree)
    };
  }

  /**
   * Extract clean abstract from first meaningful paragraph
   */
  extractAbstract(tree: Root): string {
    let abstract = '';
    
    visit(tree, 'paragraph', (node: Paragraph, index: number, parent: any) => {
      if (abstract) return; // Already found abstract
      
      // Skip paragraphs that are too early (likely metadata)
      if (index < 2) return;
      
      // Extract text content from paragraph
      const text = this.extractTextFromNode(node);
      
      // Skip if too short or contains metadata patterns
      if (text.length < 50) return;
      if (this.isMetadataLine(text)) return;
      
      abstract = text.length > 200 ? text.substring(0, 200) + '...' : text;
    });

    return abstract || 'No abstract available.';
  }

  /**
   * Extract all headings with proper hierarchy
   */
  extractHeadings(tree: Root): { level: number; text: string; id: string }[] {
    const headings: { level: number; text: string; id: string }[] = [];
    
    visit(tree, 'heading', (node: Heading) => {
      const text = this.extractTextFromNode(node);
      const id = this.generateHeadingId(text);
      
      headings.push({
        level: node.depth,
        text,
        id
      });
    });

    return headings;
  }

  /**
   * Build hierarchical table of contents
   */
  buildTableOfContents(headings: { level: number; text: string; id: string }[]): TableOfContents[] {
    const toc: TableOfContents[] = [];
    const stack: TableOfContents[] = [];

    headings.forEach(heading => {
      const item: TableOfContents = {
        id: heading.id,
        text: heading.text,
        level: heading.level,
        children: []
      };

      // Find the right parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        toc.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    });

    return toc;
  }

  /**
   * Extract tags from content structure and headings
   */
  extractTags(tree: Root): string[] {
    const tags = new Set<string>();
    
    // Look for specification sections
    visit(tree, 'heading', (node: Heading) => {
      const text = this.extractTextFromNode(node).toLowerCase();
      
      if (text.includes('specification')) tags.add('specification');
      if (text.includes('implementation')) tags.add('implementation');
      if (text.includes('rationale')) tags.add('rationale');
      if (text.includes('backwards compatibility')) tags.add('backwards-compatibility');
      if (text.includes('security')) tags.add('security');
      if (text.includes('reference')) tags.add('reference');
      if (text.includes('test')) tags.add('test');
      if (text.includes('motivation')) tags.add('motivation');
    });

    // Look for technical indicators in content
    const allText = this.extractAllText(tree).toLowerCase();
    
    if (allText.includes('consensus')) tags.add('consensus');
    if (allText.includes('network')) tags.add('network');
    if (allText.includes('protocol')) tags.add('protocol');
    if (allText.includes('virtual machine') || allText.includes('vm')) tags.add('vm');
    if (allText.includes('subnet')) tags.add('subnet');
    if (allText.includes('avalanche')) tags.add('avalanche');
    if (allText.includes('api')) tags.add('api');
    if (allText.includes('rpc')) tags.add('rpc');

    return Array.from(tags);
  }

  /**
   * Calculate reading time based on text content (excluding code)
   */
  calculateReadingTime(tree: Root): number {
    const textContent = this.extractAllText(tree);
    const words = textContent.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
  }

  /**
   * Assess technical complexity based on content analysis
   */
  assessComplexity(tree: Root): 'Low' | 'Medium' | 'High' {
    let complexityScore = 0;
    
    // Count code blocks
    const codeBlocks = this.countCodeBlocks(tree);
    complexityScore += codeBlocks * 2;
    
    // Count technical terms
    const allText = this.extractAllText(tree).toLowerCase();
    const technicalTerms = [
      'consensus', 'protocol', 'algorithm', 'cryptographic', 'hash',
      'merkle', 'blockchain', 'validation', 'verification', 'byzantine',
      'p2p', 'networking', 'serialization', 'encoding', 'virtual machine'
    ];
    
    technicalTerms.forEach(term => {
      const matches = (allText.match(new RegExp(term, 'g')) || []).length;
      complexityScore += matches;
    });
    
    // Check for implementation sections
    if (this.hasImplementationSection(tree)) {
      complexityScore += 5;
    }
    
    // Assess based on score
    if (complexityScore >= 15) return 'High';
    if (complexityScore >= 8) return 'Medium';
    return 'Low';
  }

  /**
   * Count total words in readable text
   */
  countWords(tree: Root): number {
    const textContent = this.extractAllText(tree);
    return textContent.trim().split(/\s+/).length;
  }

  /**
   * Count code blocks in the document
   */
  countCodeBlocks(tree: Root): number {
    let count = 0;
    visit(tree, ['code', 'inlineCode'], () => {
      count++;
    });
    return count;
  }

  /**
   * Check if document has implementation sections
   */
  hasImplementationSection(tree: Root): boolean {
    let hasImplementation = false;
    
    visit(tree, 'heading', (node: Heading) => {
      const text = this.extractTextFromNode(node).toLowerCase();
      if (text.includes('implementation') || text.includes('reference implementation')) {
        hasImplementation = true;
      }
    });
    
    return hasImplementation;
  }

  /**
   * Extract ACP dependencies from content
   */
  extractDependencies(tree: Root): string[] {
    const dependencies: string[] = [];
    const allText = this.extractAllText(tree);
    
    // Look for ACP references like "ACP-1", "ACP-123"
    const acpRefs = allText.match(/ACP-\d+/g);
    if (acpRefs) {
      dependencies.push(...acpRefs.filter(ref => ref !== 'ACP-0')); // Exclude self-references
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Extract replaced ACPs
   */
  extractReplaces(tree: Root): string[] {
    const replaces: string[] = [];
    const allText = this.extractAllText(tree).toLowerCase();
    
    // Look for "replaces" section or mentions
    const replacesMatch = allText.match(/replaces?:\s*(acp-\d+(?:,\s*acp-\d+)*)/);
    if (replacesMatch) {
      const refs = replacesMatch[1].match(/acp-\d+/g);
      if (refs) replaces.push(...refs.map(ref => ref.toUpperCase()));
    }
    
    return replaces;
  }

  /**
   * Extract superseded by information
   */
  extractSupersededBy(tree: Root): string[] {
    const superseded: string[] = [];
    const allText = this.extractAllText(tree).toLowerCase();
    
    // Look for "superseded by" section or mentions
    const supersededMatch = allText.match(/superseded\s+by:\s*(acp-\d+(?:,\s*acp-\d+)*)/);
    if (supersededMatch) {
      const refs = supersededMatch[1].match(/acp-\d+/g);
      if (refs) superseded.push(...refs.map(ref => ref.toUpperCase()));
    }
    
    return superseded;
  }

  /**
   * Extract plain text from any node type
   */
  private extractTextFromNode(node: Content): string {
    let text = '';
    
    visit(node, 'text', (textNode: Text) => {
      text += textNode.value + ' ';
    });
    
    return text.trim();
  }

  /**
   * Extract all readable text from the document
   */
  private extractAllText(tree: Root): string {
    let text = '';
    
    visit(tree, 'text', (node: Text) => {
      text += node.value + ' ';
    });
    
    return text.trim();
  }

  /**
   * Check if a line contains metadata patterns
   */
  private isMetadataLine(text: string): boolean {
    const metadataPatterns = [
      /^(author|status|track|created|updated|requires|replaces|superseded-by):/i,
      /^acp-\d+/i,
      /^\s*\|/,  // Table rows
      /^#+\s/,   // Headings
      /^```/     // Code blocks
    ];
    
    return metadataPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Generate URL-friendly ID from heading text
   */
  private generateHeadingId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Search within markdown content
   */
  searchContent(content: string, query: string): boolean {
    const tree = this.processor.parse(content);
    const allText = this.extractAllText(tree).toLowerCase();
    const searchQuery = query.toLowerCase();
    
    return allText.includes(searchQuery);
  }

  /**
   * Get searchable text (excludes code blocks)
   */
  getSearchableText(content: string): string {
    const tree = this.processor.parse(content);
    let searchableText = '';
    
    visit(tree, (node) => {
      // Skip code blocks for search
      if (node.type === 'code' || node.type === 'inlineCode') {
        return;
      }
      
      if (node.type === 'text') {
        searchableText += (node as Text).value + ' ';
      }
    });
    
    return searchableText.trim();
  }
}

// Export singleton instance
export const markdownProcessor = new MarkdownProcessor();

// Convenience function for quick analysis
export function analyzeACP(content: string): MarkdownMetadata {
  return markdownProcessor.analyzeMarkdown(content);
}