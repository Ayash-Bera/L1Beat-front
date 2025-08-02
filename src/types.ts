// Chain related types
export interface Chain {
  chainId: string;
  chainName: string;
  chainLogoUri?: string;
  description?: string;
  subnetId?: string;
  platformChainId?: string;
  tps: {
    value: number;
    timestamp: number;
  } | null;
  validators: Validator[];
  networkToken?: {
    name: string;
    symbol: string;
    logoUri?: string;
  };
  explorerUrl?: string;
}

export interface Validator {
  address: string;
  active: boolean;
  uptime: number;
  weight: number;
  explorerUrl?: string;
}

// TVL related types
export interface TVLHistory {
  date: number;
  tvl: number;
}

export interface TVLHealth {
  lastUpdate: string;
  ageInHours: number;
  tvl: number;
  status: 'healthy' | 'stale';
}

// TPS related types
export interface NetworkTPS {
  totalTps: number;
  chainCount: number;
  timestamp: number;
  lastUpdate: string;
  dataAge: number;
  dataAgeUnit: string;
  updatedAt: string;
}

export interface TPSHistory {
  timestamp: number;
  totalTps: number;
  chainCount: number;
  date: number;
}

// Cumulative Transaction Count types
export interface CumulativeTxCount {
  timestamp: number;
  value: number;
}

export interface CumulativeTxCountResponse {
  success: boolean;
  chainId: string;
  count: number;
  data: CumulativeTxCount[];
}

// Health related types
export interface HealthStatus {
  status: string;
  timestamp: number;
}

// Teleporter message types
export interface TeleporterMessage {
  source: string;
  target: string;
  count: number;
}

export interface TeleporterMessageData {
  messages: TeleporterMessage[];
  metadata: {
    totalMessages: number;
    startDate: string;
    endDate: string;
    updatedAt: string;
  };
}

export interface TeleporterDailyMessage {
  sourceChain: string;
  destinationChain: string;
  messageCount: number;
}

export interface TeleporterDailyData {
  date: string;
  dateString: string;
  data: TeleporterDailyMessage[];
  totalMessages: number;
  timeWindow: number;
}

export type TimeframeOption = 7 | 14 | 30;

// ACP related types
export interface ACP {
  number: string;
  title: string;
  authors: Author[];
  status: string;
  track: string;
  content: string;
  discussion?: string;
}

export interface Author {
  name: string;
  github: string;
}
export interface ACP {
  number: string;
  title: string;
  authors: { name: string; github: string }[];
  status: string;
  track: string;
  content: string;
  discussion?: string;
}

// Enhanced ACP interface with additional metadata
export interface EnhancedACP extends ACP {
  complexity?: string;
  tags?: string[];
  readingTime?: number;
  abstract?: string;
  dependencies?: string[];
  replaces?: string[];
  supersededBy?: string[];
  folderName?: string;
}

// Statistics interface for ACP analytics
export interface ACPStats {
  total: number;
  byStatus: Record<string, number>;
  byTrack: Record<string, number>;
  byComplexity: Record<string, number>;
}

// Filter and UI state types
export type ViewMode = 'grid' | 'list';
export type SortOption = 'number' | 'title' | 'status' | 'track' | 'complexity';
export type SortOrder = 'asc' | 'desc';

export interface ACPFilters {
  status: string;
  track: string;
  complexity: string;
  author: string;
  hasDiscussion: boolean | null;
}

// Utility functions for ACP management
export interface ACPSearchOptions {
  query: string;
  filters: Partial<ACPFilters>;
  sortBy: SortOption;
  sortOrder: SortOrder;
}

// ACP relationship types
export interface ACPRelationship {
  type: 'depends' | 'replaces' | 'superseded-by';
  acpNumber: string;
  title?: string;
}

// ACP author with validation
export interface ACPAuthor {
  name: string;
  github: string;
  isValidGithub?: boolean;
}

// Enhanced ACP with computed properties
export interface ProcessedACP extends EnhancedACP {
  searchableText: string;
  relationships: ACPRelationship[];
  validatedAuthors: ACPAuthor[];
}

// API response interfaces
export interface ACPListResponse {
  acps: EnhancedACP[];
  stats: ACPStats;
  total: number;
}

export interface ACPSearchResponse {
  acps: EnhancedACP[];
  total: number;
  query: string;
  filters: ACPFilters;
}