import { performance } from 'perf_hooks';

export interface LoadTestConfig {
  duration: number; // Test duration in seconds
  concurrentUsers: number; // Number of concurrent users
  rampUpTime: number; // Ramp up time in seconds
  endpoints: LoadTestEndpoint[];
  thresholds: LoadTestThresholds;
}

export interface LoadTestEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  weight: number; // Relative frequency (higher = more requests)
  payload?: any; // For POST/PUT requests
  headers?: Record<string, string>;
}

export interface LoadTestThresholds {
  maxResponseTime: number; // Max acceptable response time in ms
  maxErrorRate: number; // Max acceptable error rate (0-1)
  minThroughput: number; // Minimum requests per second
  maxCpuUsage: number; // Max CPU usage percentage
  maxMemoryUsage: number; // Max memory usage percentage
}

export interface LoadTestResult {
  summary: {
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number; // requests per second
    errorRate: number;
    testDuration: number;
  };
  endpoints: Array<{
    url: string;
    method: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  systemMetrics: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
  };
  bottlenecks: string[];
  recommendations: string[];
  passed: boolean;
}

export class LoadTestingService {
  private results: LoadTestResult[] = [];

  /**
   * Run comprehensive load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`Starting load test with ${config.concurrentUsers} concurrent users for ${config.duration}s`);

    const startTime = performance.now();
    const requests: Array<{
      timestamp: number;
      responseTime: number;
      success: boolean;
      endpoint: string;
      error?: string;
    }> = [];

    // Initialize system monitoring
    const systemMonitor = this.startSystemMonitoring();

    // Create user simulation
    const userPromises = Array.from({ length: config.concurrentUsers }, (_, userId) =>
      this.simulateUser(userId, config, requests)
    );

    // Wait for all users to complete
    await Promise.allSettled(userPromises);

    // Stop system monitoring
    const systemMetrics = await systemMonitor.stop();

    const endTime = performance.now();
    const testDuration = (endTime - startTime) / 1000;

    // Analyze results
    const result = this.analyzeResults(requests, config, systemMetrics, testDuration);

    // Store results for historical analysis
    this.results.push(result);

    return result;
  }

  /**
   * Run stress test to find system breaking points
   */
  async runStressTest(baseConfig: LoadTestConfig, maxUsers: number, stepSize: number = 10): Promise<{
    breakingPoint: number;
    results: LoadTestResult[];
  }> {
    const results: LoadTestResult[] = [];
    let breakingPoint = baseConfig.concurrentUsers;

    for (let users = baseConfig.concurrentUsers; users <= maxUsers; users += stepSize) {
      const config = { ...baseConfig, concurrentUsers: users };
      console.log(`Running stress test with ${users} users`);

      const result = await this.runLoadTest(config);
      results.push(result);

      // Check if system is breaking
      if (result.summary.errorRate > 0.1 || // >10% error rate
          result.summary.averageResponseTime > config.thresholds.maxResponseTime * 2 ||
          result.systemMetrics.maxCpuUsage > 95 ||
          result.systemMetrics.maxMemoryUsage > 95) {
        breakingPoint = users;
        break;
      }
    }

    return { breakingPoint, results };
  }

  /**
   * Run spike test to simulate sudden traffic increases
   */
  async runSpikeTest(baseConfig: LoadTestConfig, spikeMultiplier: number = 3): Promise<LoadTestResult> {
    console.log(`Running spike test with ${spikeMultiplier}x traffic increase`);

    // Normal load phase
    const normalConfig = { ...baseConfig, duration: baseConfig.duration / 3 };
    await this.runLoadTest(normalConfig);

    // Spike phase
    const spikeConfig = {
      ...baseConfig,
      concurrentUsers: Math.floor(baseConfig.concurrentUsers * spikeMultiplier),
      duration: baseConfig.duration / 3
    };
    const spikeResult = await this.runLoadTest(spikeConfig);

    // Recovery phase
    await this.runLoadTest(normalConfig);

    return spikeResult;
  }

  /**
   * Run endurance test for long-term stability
   */
  async runEnduranceTest(config: LoadTestConfig, totalDuration: number): Promise<LoadTestResult[]> {
    const segmentDuration = 300; // 5 minutes per segment
    const segments = Math.ceil(totalDuration / segmentDuration);
    const results: LoadTestResult[] = [];

    console.log(`Running endurance test for ${totalDuration}s in ${segments} segments`);

    for (let i = 0; i < segments; i++) {
      console.log(`Running endurance segment ${i + 1}/${segments}`);
      const segmentConfig = { ...config, duration: Math.min(segmentDuration, totalDuration - (i * segmentDuration)) };
      const result = await this.runLoadTest(segmentConfig);
      results.push(result);

      // Check for performance degradation
      if (i > 0) {
        const degradation = result.summary.averageResponseTime / results[0].summary.averageResponseTime;
        if (degradation > 1.5) { // 50% performance degradation
          console.warn(`Performance degradation detected in segment ${i + 1}`);
        }
      }
    }

    return results;
  }

  /**
   * Generate performance report with recommendations
   */
  generatePerformanceReport(results: LoadTestResult[]): {
    overall: LoadTestResult;
    trends: {
      responseTimeTrend: 'improving' | 'stable' | 'degrading';
      errorRateTrend: 'improving' | 'stable' | 'degrading';
      throughputTrend: 'improving' | 'stable' | 'degrading';
    };
    recommendations: string[];
    scalability: {
      currentCapacity: number;
      recommendedCapacity: number;
      bottlenecks: string[];
    };
  } {
    const overall = this.aggregateResults(results);

    // Analyze trends
    const trends = this.analyzeTrends(results);

    // Generate recommendations
    const recommendations = this.generateRecommendations(overall, trends);

    // Assess scalability
    const scalability = this.assessScalability(results);

    return {
      overall,
      trends,
      recommendations,
      scalability,
    };
  }

  // Private helper methods
  private async simulateUser(
    userId: number,
    config: LoadTestConfig,
    requests: Array<{
      timestamp: number;
      responseTime: number;
      success: boolean;
      endpoint: string;
      error?: string;
    }>
  ): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);

    // Ramp up delay
    if (config.rampUpTime > 0) {
      const delay = (userId / config.concurrentUsers) * config.rampUpTime * 1000;
      await this.delay(delay);
    }

    while (Date.now() < endTime) {
      const endpoint = this.selectWeightedEndpoint(config.endpoints);
      const requestStart = performance.now();

      try {
        const response = await this.makeRequest(endpoint);
        const responseTime = performance.now() - requestStart;

        requests.push({
          timestamp: Date.now(),
          responseTime,
          success: response.ok,
          endpoint: endpoint.url,
        });

        // Add think time between requests (random 1-3 seconds)
        await this.delay(1000 + Math.random() * 2000);

      } catch (error) {
        requests.push({
          timestamp: Date.now(),
          responseTime: performance.now() - requestStart,
          success: false,
          endpoint: endpoint.url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private selectWeightedEndpoint(endpoints: LoadTestEndpoint[]): LoadTestEndpoint {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[0]; // Fallback
  }

  private async makeRequest(endpoint: LoadTestEndpoint): Promise<Response> {
    const options: RequestInit = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...endpoint.headers,
      },
    };

    if (endpoint.payload && ['POST', 'PUT'].includes(endpoint.method)) {
      options.body = JSON.stringify(endpoint.payload);
    }

    // In a real implementation, this would make actual HTTP requests
    // For now, we'll simulate responses
    return this.simulateHttpResponse(endpoint);
  }

  private async simulateHttpResponse(endpoint: LoadTestEndpoint): Promise<Response> {
    // Simulate network delay
    const delay = 50 + Math.random() * 200; // 50-250ms
    await this.delay(delay);

    // Simulate occasional errors
    const isError = Math.random() < 0.02; // 2% error rate

    return {
      ok: !isError,
      status: isError ? 500 : 200,
      statusText: isError ? 'Internal Server Error' : 'OK',
    } as Response;
  }

  private startSystemMonitoring() {
    // In a real implementation, this would monitor actual system metrics
    // For now, we'll simulate monitoring
    let monitoring = true;
    const metrics = {
      cpuUsage: [] as number[],
      memoryUsage: [] as number[],
    };

    const monitor = () => {
      if (!monitoring) return;

      metrics.cpuUsage.push(20 + Math.random() * 60); // 20-80% CPU
      metrics.memoryUsage.push(30 + Math.random() * 50); // 30-80% memory

      setTimeout(monitor, 1000); // Monitor every second
    };

    monitor();

    return {
      stop: async () => {
        monitoring = false;
        await this.delay(100); // Allow final metrics to be recorded

        return {
          avgCpuUsage: metrics.cpuUsage.reduce((a, b) => a + b, 0) / metrics.cpuUsage.length,
          maxCpuUsage: Math.max(...metrics.cpuUsage),
          avgMemoryUsage: metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length,
          maxMemoryUsage: Math.max(...metrics.memoryUsage),
        };
      },
    };
  }

  private analyzeResults(
    requests: Array<{
      timestamp: number;
      responseTime: number;
      success: boolean;
      endpoint: string;
      error?: string;
    }>,
    config: LoadTestConfig,
    systemMetrics: any,
    testDuration: number
  ): LoadTestResult {
    const totalRequests = requests.length;
    const successfulRequests = requests.filter(r => r.success);
    const totalErrors = totalRequests - successfulRequests.length;

    const responseTimes = requests.map(r => r.responseTime).sort((a, b) => a - b);

    const summary = {
      totalRequests,
      totalErrors,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / totalRequests,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      throughput: totalRequests / testDuration,
      errorRate: totalErrors / totalRequests,
      testDuration,
    };

    // Analyze endpoints
    const endpointStats = new Map<string, { requests: number; errors: number; responseTimes: number[] }>();
    for (const request of requests) {
      const stats = endpointStats.get(request.endpoint) || { requests: 0, errors: 0, responseTimes: [] };
      stats.requests++;
      if (!request.success) stats.errors++;
      stats.responseTimes.push(request.responseTime);
      endpointStats.set(request.endpoint, stats);
    }

    const endpoints = Array.from(endpointStats.entries()).map(([url, stats]) => ({
      url,
      method: 'GET', // Simplified
      requests: stats.requests,
      errors: stats.errors,
      avgResponseTime: stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length,
      errorRate: stats.errors / stats.requests,
    }));

    // Identify bottlenecks
    const bottlenecks = [];
    if (summary.averageResponseTime > config.thresholds.maxResponseTime) {
      bottlenecks.push(`High response time: ${summary.averageResponseTime.toFixed(0)}ms (threshold: ${config.thresholds.maxResponseTime}ms)`);
    }
    if (summary.errorRate > config.thresholds.maxErrorRate) {
      bottlenecks.push(`High error rate: ${(summary.errorRate * 100).toFixed(1)}% (threshold: ${(config.thresholds.maxErrorRate * 100)}%)`);
    }
    if (summary.throughput < config.thresholds.minThroughput) {
      bottlenecks.push(`Low throughput: ${summary.throughput.toFixed(1)} req/s (threshold: ${config.thresholds.minThroughput} req/s)`);
    }
    if (systemMetrics.maxCpuUsage > config.thresholds.maxCpuUsage) {
      bottlenecks.push(`High CPU usage: ${systemMetrics.maxCpuUsage.toFixed(1)}% (threshold: ${config.thresholds.maxCpuUsage}%)`);
    }

    // Generate recommendations
    const recommendations = this.generateLoadTestRecommendations(summary, systemMetrics, bottlenecks);

    const passed = bottlenecks.length === 0;

    return {
      summary,
      endpoints,
      systemMetrics,
      bottlenecks,
      recommendations,
      passed,
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private aggregateResults(results: LoadTestResult[]): LoadTestResult {
    if (results.length === 0) throw new Error('No results to aggregate');

    // Simplified aggregation - take the most recent result
    return results[results.length - 1];
  }

  private analyzeTrends(results: LoadTestResult[]): any {
    // Simplified trend analysis
    return {
      responseTimeTrend: 'stable' as const,
      errorRateTrend: 'stable' as const,
      throughputTrend: 'stable' as const,
    };
  }

  private generateRecommendations(overall: LoadTestResult, trends: any): string[] {
    const recommendations = [];

    if (overall.summary.averageResponseTime > 2000) {
      recommendations.push('Implement database query optimization and add appropriate indexes');
    }

    if (overall.summary.errorRate > 0.05) {
      recommendations.push('Implement circuit breaker pattern and improve error handling');
    }

    if (overall.systemMetrics.maxCpuUsage > 80) {
      recommendations.push('Consider horizontal scaling or optimize CPU-intensive operations');
    }

    if (overall.systemMetrics.maxMemoryUsage > 80) {
      recommendations.push('Implement memory optimization and consider increasing RAM');
    }

    return recommendations;
  }

  private generateLoadTestRecommendations(summary: any, systemMetrics: any, bottlenecks: string[]): string[] {
    const recommendations = [];

    if (bottlenecks.length > 0) {
      recommendations.push('Address identified bottlenecks before production deployment');
    }

    if (summary.throughput < 100) {
      recommendations.push('Optimize application performance to handle higher throughput');
    }

    if (summary.p95ResponseTime > 1000) {
      recommendations.push('Implement caching strategies to reduce response times');
    }

    return recommendations;
  }

  private assessScalability(results: LoadTestResult[]): any {
    // Simplified scalability assessment
    const lastResult = results[results.length - 1];

    return {
      currentCapacity: lastResult.summary.throughput,
      recommendedCapacity: lastResult.summary.throughput * 1.5,
      bottlenecks: lastResult.bottlenecks,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}