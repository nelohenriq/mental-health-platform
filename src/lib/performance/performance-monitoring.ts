import { performance, PerformanceObserver } from 'perf_hooks';
import * as os from 'os';

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  databaseConnections: number;
  cacheHitRate: number;
  aiResponseTime: number;
  aiCost: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'error_rate' | 'memory_usage' | 'cpu_usage' | 'throughput';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    avgThroughput: number;
    totalErrors: number;
    errorRate: number;
    uptime: number;
  };
  system: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    avgDiskUsage: number;
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
  healthScore: number; // 0-100
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  // Thresholds for alerts
  private readonly THRESHOLDS = {
    responseTime: { warning: 1000, critical: 5000 }, // ms
    errorRate: { warning: 0.05, critical: 0.10 }, // 5%, 10%
    memoryUsage: { warning: 80, critical: 95 }, // percentage
    cpuUsage: { warning: 70, critical: 90 }, // percentage
    throughput: { warning: 10, critical: 5 }, // requests per second
  };

  /**
   * Start comprehensive performance monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('Starting performance monitoring...');

    // Monitor HTTP request performance
    this.setupHttpMonitoring();

    // Monitor system resources
    this.setupSystemMonitoring();

    // Monitor database performance
    this.setupDatabaseMonitoring();

    // Monitor cache performance
    this.setupCacheMonitoring();

    // Monitor AI performance
    this.setupAIMonitoring();

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Stop performance monitoring
   */
  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('Performance monitoring stopped');
  }

  /**
   * Record custom performance metric
   */
  recordMetric(type: keyof PerformanceMetrics, value: number): void {
    // This would be called by various parts of the application
    console.log(`Recording ${type}: ${value}`);
  }

  /**
   * Generate performance report for a time period
   */
  generateReport(startDate: Date, endDate: Date): PerformanceReport {
    const periodMetrics = this.metrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= endDate
    );

    if (periodMetrics.length === 0) {
      throw new Error('No metrics available for the specified period');
    }

    // Calculate summary statistics
    const responseTimes = periodMetrics.map(m => m.responseTime);
    const summary = {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      avgThroughput: periodMetrics.reduce((sum, m) => sum + m.throughput, 0) / periodMetrics.length,
      totalErrors: periodMetrics.reduce((sum, m) => sum + (m.errorRate * 100), 0), // Simplified
      errorRate: periodMetrics.reduce((sum, m) => sum + m.errorRate, 0) / periodMetrics.length,
      uptime: this.calculateUptime(startDate, endDate),
    };

    // Calculate system metrics
    const system = {
      avgCpuUsage: periodMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / periodMetrics.length,
      maxCpuUsage: Math.max(...periodMetrics.map(m => m.cpuUsage)),
      avgMemoryUsage: periodMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / periodMetrics.length,
      maxMemoryUsage: Math.max(...periodMetrics.map(m => m.memoryUsage)),
      avgDiskUsage: 0, // Would need disk monitoring implementation
    };

    // Get alerts for the period
    const alerts = this.alerts.filter(
      a => a.timestamp >= startDate && a.timestamp <= endDate
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, system, alerts);

    // Calculate health score
    const healthScore = this.calculateHealthScore(summary, system, alerts);

    return {
      period: { start: startDate, end: endDate },
      summary,
      system,
      alerts,
      recommendations,
      healthScore,
    };
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    if (recentMetrics.length === 0) {
      return { status: 'healthy', score: 100, issues: [] };
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;

    const issues: string[] = [];
    let score = 100;

    if (avgResponseTime > this.THRESHOLDS.responseTime.critical) {
      issues.push('Critical: High response time');
      score -= 30;
    } else if (avgResponseTime > this.THRESHOLDS.responseTime.warning) {
      issues.push('Warning: Elevated response time');
      score -= 10;
    }

    if (avgErrorRate > this.THRESHOLDS.errorRate.critical) {
      issues.push('Critical: High error rate');
      score -= 30;
    } else if (avgErrorRate > this.THRESHOLDS.errorRate.warning) {
      issues.push('Warning: Elevated error rate');
      score -= 10;
    }

    if (avgCpuUsage > this.THRESHOLDS.cpuUsage.critical) {
      issues.push('Critical: High CPU usage');
      score -= 20;
    } else if (avgCpuUsage > this.THRESHOLDS.cpuUsage.warning) {
      issues.push('Warning: Elevated CPU usage');
      score -= 10;
    }

    if (avgMemoryUsage > this.THRESHOLDS.memoryUsage.critical) {
      issues.push('Critical: High memory usage');
      score -= 20;
    } else if (avgMemoryUsage > this.THRESHOLDS.memoryUsage.warning) {
      issues.push('Warning: Elevated memory usage');
      score -= 10;
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 70) status = 'critical';
    else if (score < 90) status = 'warning';

    return { status, score: Math.max(0, score), issues };
  }

  /**
   * Set up automated alerting for performance issues
   */
  setupAutomatedAlerts(): void {
    // Check metrics every minute
    setInterval(() => {
      this.checkThresholds();
    }, 60000);
  }

  // Private helper methods
  private setupHttpMonitoring(): void {
    // Monitor HTTP request performance using Performance API
    const httpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('http') || entry.name.includes('fetch')) {
          this.recordMetric('responseTime', entry.duration);
        }
      }
    });

    httpObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(httpObserver);
  }

  private setupSystemMonitoring(): void {
    // Monitor system resources
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Simplified

      this.recordMetric('memoryUsage', memoryUsagePercent);
      this.recordMetric('cpuUsage', cpuUsagePercent);
    }, 5000); // Every 5 seconds
  }

  private setupDatabaseMonitoring(): void {
    // Monitor database connection pool and query performance
    // This would integrate with your database monitoring solution
    setInterval(() => {
      // Mock database metrics - in real implementation, get from connection pool
      this.recordMetric('databaseConnections', Math.floor(Math.random() * 20) + 5);
    }, 10000);
  }

  private setupCacheMonitoring(): void {
    // Monitor cache hit rates
    setInterval(() => {
      // Mock cache metrics - in real implementation, get from cache layer
      this.recordMetric('cacheHitRate', 85 + Math.random() * 15); // 85-100%
    }, 30000);
  }

  private setupAIMonitoring(): void {
    // Monitor AI response times and costs
    setInterval(() => {
      // Mock AI metrics - in real implementation, get from AI service
      this.recordMetric('aiResponseTime', 500 + Math.random() * 1500);
      this.recordMetric('aiCost', Math.random() * 0.01);
    }, 60000);
  }

  private startMetricsCollection(): void {
    // Collect comprehensive metrics every minute
    setInterval(() => {
      const metrics: PerformanceMetrics = {
        timestamp: new Date(),
        responseTime: 0, // Would be calculated from recent requests
        throughput: 0, // Would be calculated from recent requests
        errorRate: 0, // Would be calculated from recent requests
        memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        cpuUsage: (process.cpuUsage().user + process.cpuUsage().system) / 1000000,
        activeConnections: 0, // Would need HTTP server metrics
        databaseConnections: Math.floor(Math.random() * 20) + 5,
        cacheHitRate: 85 + Math.random() * 15,
        aiResponseTime: 500 + Math.random() * 1500,
        aiCost: Math.random() * 0.01,
      };

      this.metrics.push(metrics);

      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
    }, 60000);
  }

  private checkThresholds(): void {
    const recentMetrics = this.metrics.slice(-5); // Last 5 minutes
    if (recentMetrics.length === 0) return;

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;

    // Check response time
    if (avgResponseTime > this.THRESHOLDS.responseTime.critical) {
      this.createAlert('response_time', 'critical', `Critical response time: ${avgResponseTime.toFixed(0)}ms`, avgResponseTime, this.THRESHOLDS.responseTime.critical);
    } else if (avgResponseTime > this.THRESHOLDS.responseTime.warning) {
      this.createAlert('response_time', 'high', `High response time: ${avgResponseTime.toFixed(0)}ms`, avgResponseTime, this.THRESHOLDS.responseTime.warning);
    }

    // Check error rate
    if (avgErrorRate > this.THRESHOLDS.errorRate.critical) {
      this.createAlert('error_rate', 'critical', `Critical error rate: ${(avgErrorRate * 100).toFixed(1)}%`, avgErrorRate, this.THRESHOLDS.errorRate.critical);
    } else if (avgErrorRate > this.THRESHOLDS.errorRate.warning) {
      this.createAlert('error_rate', 'high', `High error rate: ${(avgErrorRate * 100).toFixed(1)}%`, avgErrorRate, this.THRESHOLDS.errorRate.warning);
    }

    // Check CPU usage
    if (avgCpuUsage > this.THRESHOLDS.cpuUsage.critical) {
      this.createAlert('cpu_usage', 'critical', `Critical CPU usage: ${avgCpuUsage.toFixed(1)}%`, avgCpuUsage, this.THRESHOLDS.cpuUsage.critical);
    } else if (avgCpuUsage > this.THRESHOLDS.cpuUsage.warning) {
      this.createAlert('cpu_usage', 'high', `High CPU usage: ${avgCpuUsage.toFixed(1)}%`, avgCpuUsage, this.THRESHOLDS.cpuUsage.warning);
    }

    // Check memory usage
    if (avgMemoryUsage > this.THRESHOLDS.memoryUsage.critical) {
      this.createAlert('memory_usage', 'critical', `Critical memory usage: ${avgMemoryUsage.toFixed(1)}%`, avgMemoryUsage, this.THRESHOLDS.memoryUsage.critical);
    } else if (avgMemoryUsage > this.THRESHOLDS.memoryUsage.warning) {
      this.createAlert('memory_usage', 'high', `High memory usage: ${avgMemoryUsage.toFixed(1)}%`, avgMemoryUsage, this.THRESHOLDS.memoryUsage.warning);
    }

    // Check throughput
    if (avgThroughput < this.THRESHOLDS.throughput.critical) {
      this.createAlert('throughput', 'critical', `Critical throughput: ${avgThroughput.toFixed(1)} req/s`, avgThroughput, this.THRESHOLDS.throughput.critical);
    } else if (avgThroughput < this.THRESHOLDS.throughput.warning) {
      this.createAlert('throughput', 'high', `Low throughput: ${avgThroughput.toFixed(1)} req/s`, avgThroughput, this.THRESHOLDS.throughput.warning);
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      a => a.type === type && !a.resolved && a.severity === severity
    );

    if (existingAlert) {
      // Update existing alert timestamp
      existingAlert.timestamp = new Date();
      return;
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.warn(`🚨 Performance Alert: ${message}`);
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private calculateUptime(startDate: Date, endDate: Date): number {
    // Simplified uptime calculation
    const totalTime = endDate.getTime() - startDate.getTime();
    const downtime = this.alerts
      .filter(a => a.type === 'error_rate' && a.severity === 'critical' && a.timestamp >= startDate && a.timestamp <= endDate)
      .length * 60000; // Assume 1 minute downtime per critical error alert

    return Math.max(0, (totalTime - downtime) / totalTime);
  }

  private generateRecommendations(summary: any, system: any, alerts: PerformanceAlert[]): string[] {
    const recommendations = [];

    if (summary.avgResponseTime > 2000) {
      recommendations.push('Implement database query optimization and add appropriate indexes');
      recommendations.push('Consider implementing response caching for frequently accessed data');
    }

    if (summary.errorRate > 0.05) {
      recommendations.push('Implement circuit breaker pattern for external service calls');
      recommendations.push('Add comprehensive error handling and retry mechanisms');
    }

    if (system.avgCpuUsage > 70) {
      recommendations.push('Optimize CPU-intensive operations or consider horizontal scaling');
      recommendations.push('Implement background job processing for heavy computations');
    }

    if (system.avgMemoryUsage > 80) {
      recommendations.push('Implement memory optimization techniques');
      recommendations.push('Consider increasing server memory or implementing memory-efficient data structures');
    }

    if (alerts.length > 10) {
      recommendations.push('Review and optimize system configuration based on alert patterns');
      recommendations.push('Implement automated scaling based on performance metrics');
    }

    return recommendations;
  }

  private calculateHealthScore(summary: any, system: any, alerts: PerformanceAlert[]): number {
    let score = 100;

    // Response time impact
    if (summary.avgResponseTime > 5000) score -= 30;
    else if (summary.avgResponseTime > 2000) score -= 15;
    else if (summary.avgResponseTime > 1000) score -= 5;

    // Error rate impact
    if (summary.errorRate > 0.10) score -= 30;
    else if (summary.errorRate > 0.05) score -= 15;
    else if (summary.errorRate > 0.01) score -= 5;

    // System resource impact
    if (system.avgCpuUsage > 90) score -= 20;
    else if (system.avgCpuUsage > 70) score -= 10;

    if (system.avgMemoryUsage > 90) score -= 20;
    else if (system.avgMemoryUsage > 80) score -= 10;

    // Alert impact
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const highAlerts = alerts.filter(a => a.severity === 'high' && !a.resolved).length;

    score -= criticalAlerts * 10;
    score -= highAlerts * 5;

    return Math.max(0, Math.min(100, score));
  }
}