/**
 * Enhanced API Client with caching, rate limiting, and error handling
 */

import OpenAI from 'openai';

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    // Simple LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getCacheStats() {
    const now = Date.now();
    const valid = Array.from(this.cache.values()).filter(entry => now < entry.expires);
    return {
      total: this.cache.size,
      valid: valid.length,
      hitRate: valid.length / Math.max(this.cache.size, 1)
    };
  }
}

// Rate limiter
class RateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs = 60000; // 1 minute
  private maxRequests = 60; // 60 requests per minute

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requestTimes = this.requests.get(identifier)!;
    // Remove old requests
    const validRequests = requestTimes.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    return validRequests.length < this.maxRequests;
  }

  recordRequest(identifier: string): void {
    const now = Date.now();
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    this.requests.get(identifier)!.push(now);
  }
}

// Enhanced OpenAI client
export class EnhancedOpenAIClient {
  private client: OpenAI;
  private cache = new APICache();
  private rateLimiter = new RateLimiter();
  private requestQueue: Array<() => Promise<void>> = [];
  private processing = false;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  private generateCacheKey(messages: any[], model: string, temperature: number): string {
    const content = messages.map(m => m.content).join('|');
    return `chat:${model}:${temperature}:${btoa(content).slice(0, 50)}`;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await request();
      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  async createChatCompletion(params: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    max_tokens?: number;
    useCache?: boolean;
  }): Promise<any> {
    const {
      model = 'gpt-4o-mini',
      messages,
      temperature = 0.7,
      max_tokens = 800,
      useCache = true
    } = params;

    // Check cache first
    const cacheKey = this.generateCacheKey(messages, model, temperature);
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { fromCache: true, ...cached };
      }
    }

    // Rate limiting check
    const identifier = 'openai-chat';
    if (!this.rateLimiter.canMakeRequest(identifier)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          this.rateLimiter.recordRequest(identifier);
          
          const completion = await this.client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens,
          });

          const response = {
            id: completion.id,
            choices: completion.choices,
            usage: completion.usage,
            model: completion.model
          };

          // Cache the response
          if (useCache) {
            this.cache.set(cacheKey, response);
          }

          resolve(response);
        } catch (error) {
          reject(this.handleError(error));
        }
      };

      this.requestQueue.push(request);
      this.processQueue();
    });
  }

  private handleError(error: any): Error {
    if (error.status === 429) {
      return new Error('Rate limit exceeded. Please wait a moment before trying again.');
    } else if (error.status === 401) {
      return new Error('Invalid API key. Please check your OpenAI configuration.');
    } else if (error.status >= 500) {
      return new Error('OpenAI service is temporarily unavailable. Please try again later.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('Network connection failed. Please check your internet connection.');
    }
    
    return new Error(error.message || 'An unexpected error occurred with the AI service.');
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }

  clearCache(): void {
    this.cache.clear();
  }

  getQueueSize(): number {
    return this.requestQueue.length;
  }
}

// Singleton instance
export const openaiClient = new EnhancedOpenAIClient();

// Utility functions for validation
export function validateChatMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message must be a non-empty string' };
  }
  
  if (message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 10000) {
    return { isValid: false, error: 'Message is too long (max 10,000 characters)' };
  }
  
  return { isValid: true };
}

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}
