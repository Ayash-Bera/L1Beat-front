export interface LocalACP {
    number: string;
    title: string;
    authors: { name: string; github: string }[];
    status: string;
    track: string;
    discussion: string;
    content: string;
    folderName: string;
    abstract: string;
    complexity: string;
    tags: string[];
    readingTime: number;
}

interface ProcessedACPs {
    acps: LocalACP[];
    stats: any; // Don't need to define the stats type here
    lastUpdated: string;
    totalProcessed: number;
}

class ACPService {
    private acpsCache: LocalACP[] | null = null;

    async loadACPs(): Promise<LocalACP[]> {
        if (this.acpsCache) {
            return this.acpsCache;
        }

        try {
            const response = await fetch('/acps/processed-acps.json');
            if (!response.ok) {
                throw new Error('Failed to load processed ACPs. Run the build script first: npm run build:acps');
            }

            const data: ProcessedACPs = await response.json();
            
            // Sort ACPs by number descending
            const sortedAcps = data.acps.sort((a, b) => Number(b.number) - Number(a.number));

            this.acpsCache = sortedAcps;
            console.log(`Successfully loaded ${this.acpsCache.length} processed ACPs`);
            return this.acpsCache;
        } catch (error) {
            console.error('Failed to load processed ACPs:', error);
            throw new Error('Failed to load ACP data. Make sure the submodule is initialized and the build script has been run.');
        }
    }

    async loadACP(acpNumber: string): Promise<LocalACP | null> {
        const acps = await this.loadACPs();
        return acps.find(acp => acp.number === acpNumber) || null;
    }
}

export const acpService = new ACPService();
