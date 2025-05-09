import type { Chain, TVLHistory, TVLHealth, NetworkTPS, TPSHistory, HealthStatus, TeleporterMessageData, TeleporterDailyData } from './types';
import { config } from './config';

// XSS protection - sanitize strings in API responses
function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;
  
  // Replace potentially dangerous characters
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Sanitize API response recursively
function sanitizeResponse(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item));
  }
  
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = sanitizeResponse(data[key]);
      }
    }
    
    return result;
  }
  
  return data;
}

// Add caching layer for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const BASE_URL = config.apiBaseUrl;
const API_URL = `${BASE_URL}/api`;
const EXPLORER_URL = 'https://subnets.avax.network';

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Origin': window.location.origin,
};

// Define constants for rate limiting
const REQUEST_LIMIT = 50; // Max requests per minute
const REQUEST_PERIOD = 60 * 1000; // 1 minute in milliseconds

// Track API calls for rate limiting
const apiRequestTracker = {
  requests: [] as number[],
  isRateLimited: false,
  rateLimitTimeout: null as NodeJS.Timeout | null,
  
  // Record a new request timestamp
  recordRequest() {
    const now = Date.now();
    this.requests.push(now);
    
    // Remove old requests outside the tracking window
    this.requests = this.requests.filter(time => now - time < REQUEST_PERIOD);
    
    // Check if we've exceeded the limit
    if (this.requests.length > REQUEST_LIMIT && !this.isRateLimited) {
      this.isRateLimited = true;
      console.warn(`Rate limit reached: ${this.requests.length} requests in the last minute`);
      
      // Auto-reset after the time window
      if (this.rateLimitTimeout) {
        clearTimeout(this.rateLimitTimeout);
      }
      
      this.rateLimitTimeout = setTimeout(() => {
        this.isRateLimited = false;
        this.requests = [];
        console.log('Rate limit reset');
      }, REQUEST_PERIOD);
    }
    
    return this.isRateLimited;
  },
  
  // Get current request count
  getRequestCount() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < REQUEST_PERIOD);
    return this.requests.length;
  }
};

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number = CACHE_DURATION
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < duration) {
    return cached.data;
  }
  
  // Check if we're rate-limited
  if (apiRequestTracker.isRateLimited) {
    console.warn(`Request to ${key} was blocked by rate limiting`);
    
    // If we have cached data (even if expired), use it
    if (cached) {
      console.log(`Using stale cached data for ${key} due to rate limiting`);
      return cached.data;
    }
  }
  
  // Record the request attempt
  apiRequestTracker.recordRequest();

  // Fetch fresh data
  const data = await fetcher();
  
  // Sanitize the response data to prevent XSS
  const sanitizedData = sanitizeResponse(data);
  
  // Cache the sanitized data
  cache.set(key, { data: sanitizedData, timestamp: now });
  
  return sanitizedData;
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  backoffFactor: number = 2,
  timeout: number = 30000 // 30 second timeout
): Promise<T> {
  let lastError: Error = new Error('Unknown error occurred');
  let attempt = 0;
  
  // Create a new AbortController for each retry attempt
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    while (attempt < retries) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit',
          headers: {
            ...DEFAULT_HEADERS,
            ...options.headers,
            'Cache-Control': 'no-cache',
          },
        });

        // Check for HTTP errors
        if (!response.ok) {
          if (response.status === 504) {
            throw new Error('Server timeout - The request took too long to complete');
          }
          if (response.status === 429) {
            throw new Error('Rate limit exceeded - Please try again later');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          return data;
        }

        throw new Error('Invalid content type');
      } catch (error) {
        lastError = error as Error;
        
        // Check if the request was aborted (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Request timeout - The connection to the server timed out');
        }
        
        // Check if it's a CORS error
        if (error instanceof TypeError && error.message.includes('CORS')) {
          console.error('CORS error detected:', error);
          // Return fallback data for CORS errors
          return getFallbackData<T>();
        }
        
        // Check for network errors (offline)
        if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
          console.error('Network error detected:', error);
          throw new Error('Network error - Please check your internet connection');
        }
        
        attempt++;
        
        if (attempt === retries) break;
        
        const delay = Math.min(1000 * Math.pow(backoffFactor, attempt), 10000);
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    // If we've exhausted all retries, throw the last error or return fallback
    throw lastError;
  } finally {
    // Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
  
  // Return fallback data for any error after all retries
  return getFallbackData<T>();
}

// Fallback data generator
function getFallbackData<T>(): T {
  const fallbackData: Record<string, any> = {
    Chain: [],
    TVLHistory: [],
    TVLHealth: {
      lastUpdate: new Date().toISOString(),
      ageInHours: 0,
      tvl: 0,
      status: 'stale'
    },
    NetworkTPS: {
      totalTps: 0,
      chainCount: 0,
      timestamp: Date.now(),
      lastUpdate: new Date().toISOString(),
      dataAge: 0,
      dataAgeUnit: 'minutes',
      updatedAt: new Date().toISOString()
    },
    TPSHistory: [],
    HealthStatus: {
      status: 'unknown',
      timestamp: Date.now()
    },
    TeleporterMessageData: {
      messages: [],
      metadata: {
        totalMessages: 0,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    TeleporterDailyData: []
  };

  // Use type assertion instead of dynamic property access
  return fallbackData as unknown as T;
}

export async function getChains(): Promise<Chain[]> {
  return fetchWithCache('chains', async () => {
    try {
      const data = await fetchWithRetry<any[]>(`${API_URL}/chains`);
      return data.map(chain => ({
        ...chain,
        tps: chain.tps ? {
          value: Number(chain.tps.value),
          timestamp: chain.tps.timestamp
        } : null,
        validators: chain.validators.map((validator: any) => ({
          address: validator.nodeId,
          active: validator.validationStatus === 'active',
          uptime: validator.uptimePerformance,
          weight: Number(validator.amountStaked),
          explorerUrl: chain.explorerUrl ? `${EXPLORER_URL}/validators/${validator.nodeId}` : undefined
        }))
      }));
    } catch (error) {
      console.error('Chains fetch error:', error);
      return [];
    }
  });
}

export async function getTVLHistory(days: number = 30): Promise<TVLHistory[]> {
  return fetchWithCache(`tvl-history-${days}`, async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetchWithRetry<{ data: any[] }>(`${API_URL}/tvl/history?days=${days}&t=${timestamp}`);
      
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter(item => item && typeof item.date === 'number' && typeof item.tvl === 'number')
        .map(item => ({
          date: Number(item.date),
          tvl: Number(item.tvl)
        }))
        .sort((a, b) => a.date - b.date);
    } catch (error) {
      console.error('TVL history fetch error:', error);
      return [];
    }
  });
}

export async function getTVLHealth(): Promise<TVLHealth> {
  return fetchWithCache('tvl-health', async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetchWithRetry<TVLHealth>(`${API_URL}/tvl/health?t=${timestamp}`);
      
      // Validate the response fields
      if (!response || typeof response.lastUpdate !== 'string' || typeof response.tvl !== 'number') {
        throw new Error('Invalid TVL health response format');
      }

      return {
        lastUpdate: response.lastUpdate,
        ageInHours: Number(response.ageInHours) || 0,
        tvl: Number(response.tvl),
        status: response.status === 'healthy' ? 'healthy' : 'stale'
      };
    } catch (error) {
      console.error('TVL health fetch error:', error);
      return {
        lastUpdate: new Date().toISOString(),
        ageInHours: 0,
        tvl: 0,
        status: 'stale'
      };
    }
  });
}

export async function getTPSHistory(days: number = 7, chainId?: string): Promise<TPSHistory[]> {
  return fetchWithCache(`tps-history-${chainId || 'network'}-${days}`, async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const url = chainId 
        ? `${API_URL}/chains/${chainId}/tps/history?t=${timestamp}`
        : `${API_URL}/tps/network/history?days=${days}&t=${timestamp}`;

      const response = await fetchWithRetry<{
        success: boolean;
        data: Array<any>;
      }>(url);

      if (!response.success || !Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter(item => item && typeof item.timestamp === 'number' && (typeof item.value === 'number' || typeof item.totalTps === 'number'))
        .map(item => ({
          timestamp: Number(item.timestamp),
          totalTps: Number(item.value || item.totalTps || 0),
          chainCount: Number(item.chainCount || 1),
          date: item.timestamp
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('TPS history fetch error:', error);
      return [];
    }
  });
}

export async function getNetworkTPS(): Promise<NetworkTPS> {
  return fetchWithCache('network-tps', async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetchWithRetry<{
        success: boolean;
        data: NetworkTPS;
      }>(`${API_URL}/tps/network/latest?t=${timestamp}`);

      if (!response.success || !response.data) {
        throw new Error('Invalid network TPS response format');
      }

      return {
        totalTps: Number(response.data.totalTps) || 0,
        chainCount: Number(response.data.chainCount) || 0,
        timestamp: Number(response.data.timestamp) || Date.now(),
        lastUpdate: response.data.lastUpdate || new Date().toISOString(),
        dataAge: Number(response.data.dataAge) || 0,
        dataAgeUnit: response.data.dataAgeUnit || 'minutes',
        updatedAt: response.data.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Network TPS fetch error:', error);
      return {
        totalTps: 0,
        chainCount: 0,
        timestamp: Date.now(),
        lastUpdate: new Date().toISOString(),
        dataAge: 0,
        dataAgeUnit: 'minutes',
        updatedAt: new Date().toISOString()
      };
    }
  });
}

export async function getHealth(): Promise<HealthStatus> {
  return fetchWithCache('health-status', async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetchWithRetry<any>(`${BASE_URL}/health?t=${timestamp}`);
      
      // The health endpoint returns the status directly, not wrapped in a data object
      if (typeof response?.status === 'string') {
        return {
          status: response.status,
          timestamp: response.currentTime ? new Date(response.currentTime).getTime() : Date.now()
        };
      }
      
      return {
        status: 'unknown',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Health status fetch error:', error);
      return {
        status: 'unknown',
        timestamp: Date.now()
      };
    }
  }, 30000); // Cache for 30 seconds
}

export async function getTeleporterMessages(): Promise<TeleporterMessageData> {
  return fetchWithCache('teleporter-messages', async () => {
    try {
      const response = await fetchWithRetry<any>(`${API_URL}/teleporter/messages/daily-count`);
      
      if (!response || !Array.isArray(response.messages)) {
        throw new Error('Invalid Teleporter message data format');
      }
      
      return {
        messages: response.messages.map((msg: any) => ({
          source: msg.source,
          target: msg.target,
          count: Number(msg.count)
        })),
        metadata: {
          totalMessages: response.metadata?.totalMessages || 
            response.messages.reduce((sum: number, msg: any) => sum + Number(msg.count), 0),
          startDate: response.metadata?.startDate || new Date().toISOString(),
          endDate: response.metadata?.endDate || new Date().toISOString(),
          updatedAt: response.metadata?.updatedAt || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Teleporter messages fetch error:', error);
      return {
        messages: [],
        metadata: {
          totalMessages: 0,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
  }, 15 * 60 * 1000); // Cache for 15 minutes
}

export async function getTeleporterDailyHistory(days: number = 30): Promise<TeleporterDailyData[]> {
  return fetchWithCache(`teleporter-daily-history-${days}`, async () => {
    try {
      const response = await fetchWithRetry<{ data: TeleporterDailyData[] }>(
        `${API_URL}/teleporter/messages/historical-daily?days=${days}`
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid Teleporter daily history data format');
      }
      
      return response.data;
    } catch (error) {
      console.error('Teleporter daily history fetch error:', error);
      return [];
    }
  }, 15 * 60 * 1000); // Cache for 15 minutes
}