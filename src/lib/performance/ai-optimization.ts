import { prisma } from '@/lib/prisma';

export interface AIOptimizationMetrics {
  model: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  timestamp: Date;
}

export interface CostOptimizationStrategy {
  model: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  recommendations: string[];
}

export class AIOptimizationService {
  private metrics: AIOptimizationMetrics[] = [];
  private responseCache = new Map<string, { response: string; timestamp: number; cost: number }>();

  /**
   * Monitor AI API usage and performance
   */
  async logAIMetrics(
    model: string,
    tokens: number,
    cost: number,
    responseTime: number,
    success: boolean,
    cached: boolean = false
  ): Promise<void> {
    const metric: AIOptimizationMetrics = {
      model,
      requestCount: 1,
      totalTokens: tokens,
      totalCost: cost,
      averageResponseTime: responseTime,
      errorRate: success ? 0 : 1,
      cacheHitRate: cached ? 1 : 0,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Implement intelligent caching for AI responses
   */
  async getCachedResponse(prompt: string, model: string): Promise<string | null> {
    const cacheKey = this.generateCacheKey(prompt, model);
    const cached = this.responseCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      await this.logAIMetrics(model, 0, 0, 0, true, true);
      return cached.response;
    }

    return null;
  }

  /**
   * Cache AI response for future use
   */
  async cacheResponse(prompt: string, model: string, response: string, cost: number): Promise<void> {
    const cacheKey = this.generateCacheKey(prompt, model);
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      cost,
    });

    // Maintain cache size
    if (this.responseCache.size > 500) {
      this.evictOldestCacheEntries();
    }
  }

  /**
   * Optimize prompts for better performance and cost efficiency
   */
  optimizePrompt(originalPrompt: string, context?: any): string {
    // Remove redundant information
    let optimized = this.removeRedundancy(originalPrompt);

    // Add context efficiently
    if (context) {
      optimized = this.addContextEfficiently(optimized, context);
    }

    // Shorten while maintaining meaning
    optimized = this.compressPrompt(optimized);

    return optimized;
  }

  /**
   * Implement model selection based on task complexity and cost
   */
  selectOptimalModel(task: string, complexity: 'low' | 'medium' | 'high'): string {
    const modelMatrix = {
      low: 'gpt-3.5-turbo', // Cost-effective for simple tasks
      medium: 'gpt-4', // Balanced performance/cost
      high: 'gpt-4-turbo', // Best performance for complex tasks
    };

    // Analyze task type for better model selection
    if (task.includes('crisis') || task.includes('emergency')) {
      return 'gpt-4-turbo'; // Always use best model for critical situations
    }

    if (task.includes('analysis') || task.includes('assessment')) {
      return complexity === 'low' ? 'gpt-4' : 'gpt-4-turbo';
    }

    return modelMatrix[complexity];
  }

  /**
   * Batch similar requests to reduce API calls
   */
  async batchRequests(requests: Array<{ prompt: string; model: string; priority: number }>): Promise<any[]> {
    // Group by model and priority
    const batches = this.groupRequestsByModelAndPriority(requests);

    const results = [];

    for (const batch of batches) {
      if (batch.requests.length === 1) {
        // Single request - process normally
        const result = await this.processSingleRequest(batch.requests[0]);
        results.push(result);
      } else {
        // Multiple requests - batch process
        const batchResults = await this.processBatch(batch.requests);
        results.push(...batchResults);
      }
    }

    return results;
  }

  /**
   * Implement response streaming for better UX
   */
  async streamResponse(prompt: string, model: string, onChunk: (chunk: string) => void): Promise<string> {
    // Check cache first
    const cached = await this.getCachedResponse(prompt, model);
    if (cached) {
      onChunk(cached);
      return cached;
    }

    // Simulate streaming response (in real implementation, use actual streaming API)
    const fullResponse = await this.generateResponse(prompt, model);
    const words = fullResponse.split(' ');

    let streamedResponse = '';
    for (const word of words) {
      streamedResponse += word + ' ';
      onChunk(word + ' ');
      await this.delay(50); // Simulate streaming delay
    }

    await this.cacheResponse(prompt, model, fullResponse, 0.01); // Mock cost
    return fullResponse;
  }

  /**
   * Analyze usage patterns and provide optimization recommendations
   */
  async analyzeUsagePatterns(): Promise<{
    costBreakdown: Record<string, number>;
    performanceMetrics: Record<string, number>;
    recommendations: string[];
  }> {
    const costBreakdown: Record<string, number> = {};
    const performanceMetrics: Record<string, number> = {};

    // Aggregate metrics by model
    for (const metric of this.metrics) {
      if (!costBreakdown[metric.model]) {
        costBreakdown[metric.model] = 0;
        performanceMetrics[metric.model] = 0;
      }
      costBreakdown[metric.model] += metric.totalCost;
      performanceMetrics[metric.model] += metric.averageResponseTime;
    }

    // Calculate averages
    for (const model of Object.keys(performanceMetrics)) {
      const modelMetrics = this.metrics.filter(m => m.model === model);
      performanceMetrics[model] = modelMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / modelMetrics.length;
    }

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(costBreakdown, performanceMetrics);

    return {
      costBreakdown,
      performanceMetrics,
      recommendations,
    };
  }

  /**
   * Implement rate limiting and quota management
   */
  async checkRateLimit(userId: string, model: string): Promise<{ allowed: boolean; resetTime?: Date }> {
    // Simplified rate limiting - in production, use Redis or similar
    const userRequests = this.metrics.filter(m =>
      m.timestamp > new Date(Date.now() - 60000) // Last minute
    ).length;

    const limits = {
      'gpt-3.5-turbo': 100,
      'gpt-4': 50,
      'gpt-4-turbo': 25,
    };

    const limit = limits[model as keyof typeof limits] || 10;

    if (userRequests >= limit) {
      return {
        allowed: false,
        resetTime: new Date(Date.now() + 60000),
      };
    }

    return { allowed: true };
  }

  /**
   * Optimize token usage by implementing context compression
   */
  compressContext(context: any[]): any[] {
    // Remove duplicate information
    const uniqueContext = this.removeDuplicateContext(context);

    // Summarize long entries
    const summarizedContext = uniqueContext.map(entry => {
      if (typeof entry === 'string' && entry.length > 500) {
        return this.summarizeText(entry);
      }
      return entry;
    });

    // Prioritize recent and relevant information
    return this.prioritizeContext(summarizedContext);
  }

  /**
   * Monitor and optimize AI model performance
   */
  async monitorModelPerformance(): Promise<{
    modelComparison: Record<string, any>;
    bestPerformingModel: string;
    costEfficiency: Record<string, number>;
  }> {
    const modelStats: Record<string, any> = {};

    for (const metric of this.metrics) {
      if (!modelStats[metric.model]) {
        modelStats[metric.model] = {
          totalRequests: 0,
          totalCost: 0,
          totalResponseTime: 0,
          errorCount: 0,
          cacheHits: 0,
        };
      }

      const stats = modelStats[metric.model];
      stats.totalRequests += metric.requestCount;
      stats.totalCost += metric.totalCost;
      stats.totalResponseTime += metric.averageResponseTime;
      stats.errorCount += metric.errorRate;
      stats.cacheHits += metric.cacheHitRate;
    }

    // Calculate averages and efficiency metrics
    const modelComparison: Record<string, any> = {};
    const costEfficiency: Record<string, number> = {};

    for (const [model, stats] of Object.entries(modelStats)) {
      const avgResponseTime = stats.totalResponseTime / stats.totalRequests;
      const errorRate = stats.errorCount / stats.totalRequests;
      const costPerRequest = stats.totalCost / stats.totalRequests;
      const cacheHitRate = stats.cacheHits / stats.totalRequests;

      modelComparison[model] = {
        averageResponseTime: avgResponseTime,
        errorRate,
        costPerRequest,
        cacheHitRate,
        totalRequests: stats.totalRequests,
      };

      costEfficiency[model] = 1 / (costPerRequest * (1 + errorRate) * avgResponseTime);
    }

    // Find best performing model (weighted score)
    const bestPerformingModel = Object.entries(modelComparison).reduce((best, [model, stats]) => {
      const score = (1 / stats.averageResponseTime) * (1 - stats.errorRate) * stats.cacheHitRate;
      const bestScore = best ? (1 / modelComparison[best].averageResponseTime) * (1 - modelComparison[best].errorRate) * modelComparison[best].cacheHitRate : 0;
      return score > bestScore ? model : best;
    }, '');

    return {
      modelComparison,
      bestPerformingModel,
      costEfficiency,
    };
  }

  // Private helper methods
  private generateCacheKey(prompt: string, model: string): string {
    // Create a hash of the prompt for caching
    let hash = 0;
    const combined = prompt + model;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${model}_${hash}`;
  }

  private isCacheValid(timestamp: number): boolean {
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - timestamp < CACHE_TTL;
  }

  private evictOldestCacheEntries(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.responseCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.responseCache.delete(oldestKey);
    }
  }

  private removeRedundancy(prompt: string): string {
    // Simple redundancy removal - in production, use more sophisticated NLP
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueSentences = [...new Set(sentences.map(s => s.trim()))];
    return uniqueSentences.join('. ') + '.';
  }

  private addContextEfficiently(prompt: string, context: any): string {
    // Add only relevant context
    const relevantContext = this.extractRelevantContext(prompt, context);
    return `${relevantContext}\n\n${prompt}`;
  }

  private compressPrompt(prompt: string): string {
    // Remove unnecessary words while maintaining meaning
    return prompt
      .replace(/\s+/g, ' ')
      .replace(/please\s+/gi, '')
      .replace(/could you\s+/gi, '')
      .trim();
  }

  private groupRequestsByModelAndPriority(requests: Array<{ prompt: string; model: string; priority: number }>) {
    const batches: Array<{ model: string; priority: number; requests: typeof requests }> = [];

    for (const request of requests) {
      const existingBatch = batches.find(b => b.model === request.model && b.priority === request.priority);
      if (existingBatch) {
        existingBatch.requests.push(request);
      } else {
        batches.push({
          model: request.model,
          priority: request.priority,
          requests: [request],
        });
      }
    }

    return batches;
  }

  private async processSingleRequest(request: { prompt: string; model: string; priority: number }) {
    return this.generateResponse(request.prompt, request.model);
  }

  private async processBatch(requests: Array<{ prompt: string; model: string; priority: number }>) {
    // Simplified batch processing - combine prompts
    const combinedPrompt = requests.map(r => r.prompt).join('\n\n---\n\n');
    const batchResponse = await this.generateResponse(combinedPrompt, requests[0].model);

    // Split response back into individual responses (simplified)
    return batchResponse.split('---').map(r => r.trim());
  }

  private generateOptimizationRecommendations(
    costBreakdown: Record<string, number>,
    performanceMetrics: Record<string, number>
  ): string[] {
    const recommendations = [];

    // Cost optimization
    const totalCost = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);
    if (totalCost > 100) { // Arbitrary threshold
      recommendations.push('Consider implementing response caching to reduce API costs');
    }

    // Performance optimization
    for (const [model, responseTime] of Object.entries(performanceMetrics)) {
      if (responseTime > 5000) {
        recommendations.push(`Consider using a faster model than ${model} for time-sensitive operations`);
      }
    }

    // Model selection optimization
    const modelUsage = Object.entries(costBreakdown).sort(([,a], [,b]) => b - a);
    if (modelUsage.length > 1) {
      recommendations.push(`Your most expensive model is ${modelUsage[0][0]}. Consider optimizing its usage.`);
    }

    return recommendations;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractRelevantContext(prompt: string, context: any): string {
    // Simplified context extraction - in production, use semantic similarity
    return typeof context === 'string' ? context : JSON.stringify(context);
  }

  private removeDuplicateContext(context: any[]): any[] {
    return [...new Set(context.map(c => JSON.stringify(c)))].map(c => JSON.parse(c));
  }

  private summarizeText(text: string): string {
    // Very basic summarization - in production, use NLP models
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ') + '.';
  }

  private prioritizeContext(context: any[]): any[] {
    // Sort by recency/timestamp if available, otherwise return as-is
    return context.sort((a, b) => {
      const aTime = a.timestamp || a.createdAt || 0;
      const bTime = b.timestamp || b.createdAt || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  private async generateResponse(prompt: string, model: string): Promise<string> {
    // Mock response generation - in production, call actual AI API
    await this.logAIMetrics(model, 100, 0.01, 2000, true);
    return `Response to: ${prompt.substring(0, 50)}...`;
  }
}