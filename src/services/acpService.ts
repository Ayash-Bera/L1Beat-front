// src/services/acpService.ts

export interface LocalACP {
    number: string;
    title: string;
    authors: { name: string; github: string }[];
    status: string;
    track: string;
    discussion: string;
    content: string;
    folderName: string;
    abstract?: string;
    complexity?: string;
    tags?: string[];
    readingTime?: number;
}

interface ProcessedACPData {
    acps: LocalACP[];
    stats: {
        total: number;
        byStatus: Record<string, number>;
        byTrack: Record<string, number>;
        byComplexity: Record<string, number>;
    };
    lastUpdated: string;
    totalProcessed: number;
}

class ACPService {
    private cache: LocalACP[] | null = null;
    private lastCacheTime: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async loadACPs(): Promise<LocalACP[]> {
        try {
            // Check cache first
            if (this.cache && Date.now() - this.lastCacheTime < this.CACHE_DURATION) {
                console.log('Using cached ACP data');
                return this.cache;
            }

            console.log('Loading ACPs from local data...');
            
            // Try to load from processed JSON first
            const acps = await this.loadFromProcessedData();
            
            if (acps.length > 0) {
                this.cache = acps;
                this.lastCacheTime = Date.now();
                return acps;
            }

            // Fallback to direct file loading
            console.log('Falling back to direct file loading...');
            const directACPs = await this.loadACPsDirectly();
            
            this.cache = directACPs;
            this.lastCacheTime = Date.now();
            return directACPs;

        } catch (error) {
            console.error('Failed to load ACPs:', error);
            throw new Error(`Failed to load ACP data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async loadACP(acpNumber: string): Promise<LocalACP | null> {
        try {
            const acps = await this.loadACPs();
            return acps.find(acp => acp.number === acpNumber) || null;
        } catch (error) {
            console.error(`Failed to load ACP-${acpNumber}:`, error);
            return null;
        }
    }

    private async loadFromProcessedData(): Promise<LocalACP[]> {
        try {
            console.log('Attempting to load from processed-acps.json...');
            const response = await fetch('/acps/processed-acps.json');
            
            if (!response.ok) {
                console.log('processed-acps.json not found, may need to run build script');
                return [];
            }

            const data: ProcessedACPData = await response.json();
            console.log(`Loaded ${data.acps.length} ACPs from processed data (updated: ${data.lastUpdated})`);
            
            return data.acps || [];
        } catch (error) {
            console.warn('Failed to load processed ACP data:', error);
            return [];
        }
    }

    private async loadACPsDirectly(): Promise<LocalACP[]> {
        try {
            console.log('Loading ACPs directly from files...');
            
            // First, try to get the index
            const indexResponse = await fetch('/acps/index.json');
            if (!indexResponse.ok) {
                throw new Error('No ACP index found. Run the build script first: npm run build:acps');
            }

            const index = await indexResponse.json();
            console.log(`Found ${index.folders.length} ACP folders in index`);

            const acpPromises = index.folders.map(async (folderName: string) => {
                const match = folderName.match(/^(\d+)-/);
                if (!match) return null;

                const number = match[1];

                try {
                    const contentResponse = await fetch(`/acps/ACPs/${folderName}/README.md`);
                    if (!contentResponse.ok) {
                        console.warn(`Failed to load ACP-${number}: ${contentResponse.status}`);
                        return null;
                    }

                    const content = await contentResponse.text();
                    return this.parseACPMarkdown(content, number, folderName);
                } catch (err) {
                    console.warn(`Failed to load ACP-${number}:`, err);
                    return null;
                }
            });

            const acps = (await Promise.all(acpPromises))
                .filter((acp): acp is LocalACP => acp !== null)
                .sort((a, b) => Number(b.number) - Number(a.number));

            console.log(`Successfully loaded ${acps.length} ACPs directly`);
            return acps;
        } catch (error) {
            console.error('Failed to load ACPs directly:', error);
            throw new Error('Failed to load ACP data. Make sure the submodule is initialized and build script has been run.');
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
            let abstract = '';

            // Parse the ACP metadata table
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (!line) continue;

                // Detect table start
                if (line.startsWith('| ACP |') || line.includes('| **ACP** |')) {
                    inTable = true;
                    continue;
                }

                // Detect table end
                if (inTable && line.startsWith('#')) {
                    inTable = false;
                    // Try to extract abstract from first paragraph after table
                    if (line.startsWith('## Abstract')) {
                        let j = i + 1;
                        while (j < lines.length) {
                            const abstractLine = lines[j].trim();
                            if (!abstractLine) {
                                j++;
                                continue;
                            }
                            if (abstractLine.startsWith('#')) break;
                            if (abstractLine.length > 50) {
                                abstract = abstractLine.substring(0, 200);
                                if (abstract.length === 200) abstract += '...';
                                break;
                            }
                            j++;
                        }
                    }
                    continue;
                }

                // Parse table rows
                if (inTable && line.startsWith('|')) {
                    if (line.includes('| **Title** |')) {
                        title = this.extractTableValue(line);
                    } else if (line.includes('| **Authors** |')) {
                        const authorsStr = this.extractTableValue(line);
                        authors = this.parseAuthors(authorsStr);
                    } else if (line.includes('| **Status** |')) {
                        status = this.extractTableValue(line);
                    } else if (line.includes('| **Track** |')) {
                        track = this.extractTableValue(line);
                    } else if (line.includes('| **Discussions** |') || line.includes('| **Discussion** |')) {
                        const discussionStr = this.extractTableValue(line);
                        discussion = this.extractDiscussionUrl(discussionStr);
                    }
                }
            }

            // If no abstract found, extract from content
            if (!abstract) {
                abstract = this.extractAbstractFromContent(markdown);
            }

            return {
                number: acpNumber,
                title: title || `ACP-${acpNumber}`,
                authors: authors.length > 0 ? authors : [{ name: 'Unknown', github: '' }],
                status: status || 'Unknown',
                track: track || 'Unknown',
                discussion: discussion || '',
                content: markdown,
                folderName: folderName,
                abstract: abstract || 'No abstract available.',
                complexity: this.calculateComplexity(markdown),
                tags: this.extractTags(markdown, title),
                readingTime: Math.max(1, Math.ceil(markdown.length / 1000))
            };

        } catch (error) {
            console.warn(`Failed to parse ACP-${acpNumber}:`, error);
            return null;
        }
    }

    private extractTableValue(line: string): string {
        // Extract value from table row like "| **Field** | Value |"
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            return parts[2].replace(/\*\*/g, '').trim();
        }
        return '';
    }

    private parseAuthors(authorsStr: string): { name: string; github: string }[] {
        if (!authorsStr) return [];
        
        const authors: { name: string; github: string }[] = [];
        const authorParts = authorsStr.split(',').map(a => a.trim());
        
        for (const authorPart of authorParts) {
            // Match formats like "Name (@github)" or "[Name](mailto:email)" or just "Name"
            const githubMatch = authorPart.match(/(.+?)\s*\(@(.+?)\)/);
            const emailMatch = authorPart.match(/\[(.+?)\]\(mailto:(.+?)\)/);
            
            if (githubMatch) {
                authors.push({
                    name: githubMatch[1].trim(),
                    github: githubMatch[2].trim()
                });
            } else if (emailMatch) {
                authors.push({
                    name: emailMatch[1].trim(),
                    github: ''
                });
            } else {
                // Clean up markdown links and just get the name
                const cleanName = authorPart.replace(/[\[\]()]/g, '').split('@')[0].trim();
                if (cleanName) {
                    authors.push({
                        name: cleanName,
                        github: ''
                    });
                }
            }
        }
        
        return authors.length > 0 ? authors : [{ name: authorsStr, github: '' }];
    }

    private extractDiscussionUrl(discussionStr: string): string {
        if (!discussionStr) return '';
        
        // Extract URL from markdown link [text](url)
        const urlMatch = discussionStr.match(/\(([^)]+)\)/);
        if (urlMatch) {
            return urlMatch[1];
        }
        
        // If it's already a URL
        if (discussionStr.startsWith('http')) {
            return discussionStr;
        }
        
        return '';
    }

    private extractAbstractFromContent(markdown: string): string {
        const lines = markdown.split('\n');
        let inTable = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Skip tables
            if (trimmed.startsWith('|')) {
                inTable = true;
                continue;
            }
            
            if (inTable && trimmed.startsWith('#')) {
                inTable = false;
                continue;
            }
            
            // Find first substantial paragraph that's not a header or table
            if (!inTable && !trimmed.startsWith('#') && trimmed.length > 50) {
                let abstract = trimmed.substring(0, 200);
                if (abstract.length === 200) abstract += '...';
                return abstract;
            }
        }
        
        return 'No abstract available.';
    }

    private calculateComplexity(content: string): string {
        const length = content.length;
        const complexTerms = [
            'implementation', 'algorithm', 'cryptographic', 'consensus', 
            'protocol', 'specification', 'technical', 'architecture'
        ];
        
        const hasComplexTerms = complexTerms.some(term => 
            content.toLowerCase().includes(term)
        );
        
        if (length > 10000 || hasComplexTerms) return 'High';
        if (length > 5000) return 'Medium';
        return 'Low';
    }

    private extractTags(content: string, title: string): string[] {
        const tags: string[] = [];
        const lowerContent = content.toLowerCase();
        const lowerTitle = title.toLowerCase();
        
        // Common ACP categories/tags
        const tagKeywords: Record<string, string[]> = {
            'consensus': ['consensus', 'validator', 'staking'],
            'networking': ['network', 'p2p', 'communication'],
            'economics': ['fee', 'economic', 'incentive', 'reward'],
            'governance': ['governance', 'voting', 'proposal'],
            'security': ['security', 'cryptographic', 'signature'],
            'performance': ['performance', 'optimization', 'efficiency'],
            'interoperability': ['interop', 'bridge', 'cross-chain'],
            'vm': ['virtual machine', 'vm', 'execution'],
            'api': ['api', 'interface', 'endpoint']
        };
        
        for (const [tag, keywords] of Object.entries(tagKeywords)) {
            if (keywords.some(keyword => 
                lowerContent.includes(keyword) || lowerTitle.includes(keyword)
            )) {
                tags.push(tag);
            }
        }
        
        return tags;
    }

    // Clear cache manually if needed
    clearCache(): void {
        this.cache = null;
        this.lastCacheTime = 0;
    }
}

// Export singleton instance
export const acpService = new ACPService();