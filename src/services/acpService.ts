// src/services/acpService.ts
// Local file-based ACP service using git submodule

export interface LocalACP {
    number: string;
    title: string;
    authors: { name: string; github: string }[];
    status: string;
    track: string;
    content: string;
    discussion?: string;
    complexity?: string;
    tags?: string[];
    readingTime?: number;
    abstract?: string;
    dependencies?: string[];
    replaces?: string[];
    supersededBy?: string[];
    folderName?: string;
}

export interface ACPStats {
    total: number;
    byStatus: Record<string, number>;
    byTrack: Record<string, number>;
    byComplexity: Record<string, number>;
}

class ACPDataService {
    private cache: Map<string, any> = new Map();
    private lastFetchTime = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async getAllLocalACPs(): Promise<LocalACP[]> {
        const cacheKey = 'all-acps';
        const now = Date.now();

        // Check cache first
        if (this.cache.has(cacheKey) && (now - this.lastFetchTime) < this.CACHE_DURATION) {
            return this.cache.get(cacheKey);
        }

        try {
            // In production, these files would be served statically
            // In development, we'll need to read from the submodule
            const acps = await this.fetchACPsFromSubmodule();

            this.cache.set(cacheKey, acps);
            this.lastFetchTime = now;

            return acps;
        } catch (error) {
            console.error('Error loading ACPs:', error);
            throw new Error('Failed to load ACP data');
        }
    }

    async getACPByNumber(number: string): Promise<LocalACP | null> {
        const acps = await this.getAllLocalACPs();
        return acps.find(acp => acp.number === number) || null;
    }

    async getACPStats(): Promise<ACPStats> {
        const acps = await this.getAllLocalACPs();
        return this.calculateStats(acps);
    }

    private async fetchACPsFromSubmodule(): Promise<LocalACP[]> {
        // This approach works by pre-processing the submodule files
        // We'll create a build script that generates a JSON file from the submodule

        try {
            // Fetch the pre-processed ACP data
            const response = await fetch('/acps/processed-acps.json');
            if (!response.ok) {
                throw new Error('Failed to load processed ACP data');
            }

            const data = await response.json();
            return data.acps || [];
        } catch (error) {
            // Fallback: try to load individual files (for development)
            console.warn('Falling back to individual file loading');
            return await this.loadACPsDirectly();
        }
    }

    private async loadACPsDirectly(): Promise<LocalACP[]> {
        // This would be used in development or as a fallback
        // Load the directory listing first

        try {
            const indexResponse = await fetch('/acps/ACPs/index.json');
            if (!indexResponse.ok) {
                throw new Error('No ACP index found');
            }

            const index = await indexResponse.json();
            const acpPromises = index.folders.map(async (folderName: string) => {
                const match = folderName.match(/^(\d+)-/);
                if (!match) return null;

                const number = match[1];

                try {
                    const contentResponse = await fetch(`/acps/ACPs/${folderName}/README.md`);
                    if (!contentResponse.ok) return null;

                    const content = await contentResponse.text();
                    return this.parseACPMarkdown(content, number, folderName);
                } catch (err) {
                    console.warn(`Failed to load ACP-${number}`);
                    return null;
                }
            });

            const acps = (await Promise.all(acpPromises))
                .filter((acp): acp is LocalACP => acp !== null)
                .sort((a, b) => Number(b.number) - Number(a.number));

            return acps;
        } catch (error) {
            console.error('Failed to load ACPs directly:', error);
            return [];
        }
    }

    private parseACPMarkdown(markdown: string, acpNumber: string, folderName: string): LocalACP | null {
        try {
            const lines = markdown.split('\n');
            let title = '';
            let authors: { name: string; github: string }[] = [];
            let status = '';
            let track = '';
            let discussion = '';
            let inTable = false;

            // Enhanced parsing for dependencies and relationships
            let dependencies: string[] = [];
            let replaces: string[] = [];
            let supersededBy: string[] = [];

            // Extract abstract (first paragraph after table)
            let abstract = '';
            let afterTable = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (!line.trim()) continue;

                if (line.startsWith('| ACP |')) {
                    inTable = true;
                    continue;
                }

                if (inTable && line.startsWith('##')) {
                    afterTable = true;
                    inTable = false;
                    continue;
                }

                if (inTable) {
                    if (line.includes('| **Title** |')) {
                        title = line.split('|')[2].trim();
                    } else if (line.includes('| **Author(s)** |')) {
                        const authorText = line.split('|')[2];
                        authors = this.parseAuthors(authorText);
                    } else if (line.includes('| **Status** |')) {
                        const statusText = line.split('|')[2];
                        status = this.parseStatus(statusText);
                        discussion = this.parseDiscussionLink(statusText);
                    } else if (line.includes('| **Track** |')) {
                        track = line.split('|')[2].trim();
                    } else if (line.includes('| **Depends** |') || line.includes('| **Dependencies** |')) {
                        dependencies = this.parseRelationships(line.split('|')[2]);
                    } else if (line.includes('| **Replaces** |')) {
                        replaces = this.parseRelationships(line.split('|')[2]);
                    } else if (line.includes('| **Superseded-By** |')) {
                        supersededBy = this.parseRelationships(line.split('|')[2]);
                    }
                }

                // Get abstract from first substantial paragraph after table
                if (afterTable && !abstract && line.trim() && !line.startsWith('#') && !line.startsWith('|')) {
                    abstract = line.trim();
                    if (abstract.length > 200) {
                        abstract = abstract.substring(0, 200) + '...';
                    }
                }
            }

            // Calculate reading time (rough estimate)
            const wordCount = markdown.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

            // Extract potential tags from title and content
            const tags = this.extractTags(title, markdown);

            // Determine complexity based on content
            const complexity = this.determineComplexity(markdown);

            return {
                number: acpNumber,
                title,
                authors,
                status,
                track,
                content: markdown,
                discussion,
                abstract,
                readingTime,
                tags,
                complexity,
                dependencies,
                replaces,
                supersededBy,
                folderName
            };
        } catch (err) {
            console.error(`Error parsing ACP-${acpNumber}:`, err);
            return null;
        }
    }

    private parseAuthors(text: string): { name: string; github: string }[] {
        const authors: { name: string; github: string }[] = [];
        const matches = text.match(/([^(@\n]+)(?:\s*\([@]([^)]+)\))?/g);

        if (matches) {
            matches.forEach(match => {
                const [_, name, github] = match.match(/([^(@\n]+)(?:\s*\([@]([^)]+)\))?/) || [];
                if (name) {
                    authors.push({
                        name: name.trim(),
                        github: github?.trim() || name.trim()
                    });
                }
            });
        }

        return authors;
    }

    private parseStatus(text: string): string {
        const statusMatch = text.match(/\[([^\]]+)\]|\b(\w+)\b/);
        return (statusMatch?.[1] || statusMatch?.[2] || 'Unknown').trim();
    }

    private parseDiscussionLink(text: string): string | undefined {
        const match = text.match(/\[Discussion\]\(([^)]+)\)/);
        return match ? match[1] : undefined;
    }

    private parseRelationships(text: string): string[] {
        const relationships: string[] = [];
        const matches = text.match(/ACP-(\d+)/g);
        if (matches) {
            matches.forEach(match => {
                const number = match.replace('ACP-', '');
                if (number) relationships.push(number);
            });
        }
        return relationships;
    }

    private extractTags(title: string, content: string): string[] {
        const tags: string[] = [];
        const titleLower = title.toLowerCase();
        const contentLower = content.toLowerCase();

        // Common ACP topics
        if (titleLower.includes('consensus') || contentLower.includes('consensus')) tags.push('Consensus');
        if (titleLower.includes('validator') || contentLower.includes('validator')) tags.push('Validators');
        if (titleLower.includes('staking') || contentLower.includes('staking')) tags.push('Staking');
        if (titleLower.includes('network') || contentLower.includes('network')) tags.push('Network');
        if (titleLower.includes('upgrade') || contentLower.includes('upgrade')) tags.push('Upgrade');
        if (titleLower.includes('fee') || contentLower.includes('fee')) tags.push('Fees');
        if (titleLower.includes('subnet') || contentLower.includes('subnet')) tags.push('Subnets');

        return tags.slice(0, 3); // Limit to 3 tags
    }

    private determineComplexity(content: string): string {
        const wordCount = content.split(/\s+/).length;
        const technicalTerms = (content.match(/\b(implementation|algorithm|protocol|consensus|merkle|hash|signature|cryptograph|byzantine)\b/gi) || []).length;

        if (wordCount > 3000 || technicalTerms > 20) return 'High';
        if (wordCount > 1500 || technicalTerms > 10) return 'Medium';
        return 'Low';
    }

    private calculateStats(acps: LocalACP[]): ACPStats {
        const stats: ACPStats = {
            total: acps.length,
            byStatus: {},
            byTrack: {},
            byComplexity: {}
        };

        acps.forEach(acp => {
            // Status
            stats.byStatus[acp.status] = (stats.byStatus[acp.status] || 0) + 1;

            // Track
            stats.byTrack[acp.track] = (stats.byTrack[acp.track] || 0) + 1;

            // Complexity
            if (acp.complexity) {
                stats.byComplexity[acp.complexity] = (stats.byComplexity[acp.complexity] || 0) + 1;
            }
        });

        return stats;
    }

    // Search and filter functions
    searchACPs(acps: LocalACP[], query: string): LocalACP[] {
        const searchTerm = query.toLowerCase();
        return acps.filter(acp =>
            acp.title.toLowerCase().includes(searchTerm) ||
            acp.number.includes(searchTerm) ||
            acp.authors.some(author => author.name.toLowerCase().includes(searchTerm)) ||
            acp.content.toLowerCase().includes(searchTerm)
        );
    }

    filterACPs(acps: LocalACP[], filters: Record<string, any>): LocalACP[] {
        return acps.filter(acp => {
            if (filters.status && acp.status !== filters.status) return false;
            if (filters.track && acp.track !== filters.track) return false;
            if (filters.complexity && acp.complexity !== filters.complexity) return false;
            if (filters.author && !acp.authors.some(author =>
                author.name.toLowerCase().includes(filters.author.toLowerCase())
            )) return false;
            if (filters.hasDiscussion !== null && !!acp.discussion !== filters.hasDiscussion) return false;

            return true;
        });
    }

    sortACPs(acps: LocalACP[], sortBy: string, sortOrder: 'asc' | 'desc'): LocalACP[] {
        return [...acps].sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
                case 'number':
                    aVal = Number(a.number);
                    bVal = Number(b.number);
                    break;
                case 'title':
                    aVal = a.title.toLowerCase();
                    bVal = b.title.toLowerCase();
                    break;
                case 'status':
                    aVal = a.status.toLowerCase();
                    bVal = b.status.toLowerCase();
                    break;
                case 'track':
                    aVal = a.track.toLowerCase();
                    bVal = b.track.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
}

// Export service instance
export const acpService = new ACPDataService();

// Export convenience functions
export const getAllLocalACPs = () => acpService.getAllLocalACPs();
export const getACPByNumber = (number: string) => acpService.getACPByNumber(number);
export const getACPStats = () => acpService.getACPStats();
export const searchACPs = (acps: LocalACP[], query: string) => acpService.searchACPs(acps, query);
export const filterACPs = (acps: LocalACP[], filters: Record<string, any>) => acpService.filterACPs(acps, filters);
export const sortACPs = (acps: LocalACP[], sortBy: string, sortOrder: 'asc' | 'desc') => acpService.sortACPs(acps, sortBy, sortOrder);