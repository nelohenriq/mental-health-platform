import { LoadTestingService, LoadTestResult, LoadTestConfig } from '@/lib/performance/load-testing';
describe('Load Testing', () => {
  describe('generatePerformanceReport', () => {
    let loadTestingService: LoadTestingService;

    beforeEach(() => {
      loadTestingService = new LoadTestingService();
    });

    it('should generate comprehensive load report', () => {
      const mockLoadTestResult: LoadTestResult = {
        summary: {
          totalRequests: 1000,
          totalErrors: 50,
          averageResponseTime: 250,
          minResponseTime: 100,
          maxResponseTime: 2000,
          p95ResponseTime: 500,
          p99ResponseTime: 800,
          throughput: 50,
          errorRate: 0.05,
          testDuration: 20,
        },
        endpoints: [
          {
            url: 'http://localhost/api/test',
            method: 'GET',
            requests: 1000,
            errors: 50,
            avgResponseTime: 250,
            errorRate: 0.05,
          },
        ],
        systemMetrics: {
          avgCpuUsage: 50,
          maxCpuUsage: 70,
          avgMemoryUsage: 60,
          maxMemoryUsage: 80,
        },
        bottlenecks: [],
        recommendations: ['Some recommendation'],
        passed: true,
      };

      const report = loadTestingService.generatePerformanceReport([mockLoadTestResult]);

      expect(report.overall.summary.totalRequests).equal(1000);
      expect(report.overall.summary.errorRate).equal(0.05);
      expect(report.overall.summary.averageResponseTime).equal(250);
      expect(report.recommendations.length).greaterThan(0);
    });

    it('should provide recommendations for poor performance', () => {
      const poorLoadTestResult: LoadTestResult = {
        summary: {
          totalRequests: 100,
          totalErrors: 40,
          averageResponseTime: 5000,
          minResponseTime: 1000,
          maxResponseTime: 15000,
          p95ResponseTime: 10000,
          p99ResponseTime: 14000,
          throughput: 2,
          errorRate: 0.4,
          testDuration: 50,
        },
        endpoints: [
          {
            url: 'http://localhost/api/test',
            method: 'GET',
            requests: 100,
            errors: 40,
            avgResponseTime: 5000,
            errorRate: 0.4,
          },
        ],
        systemMetrics: {
          avgCpuUsage: 90,
          maxCpuUsage: 95,
          avgMemoryUsage: 85,
          maxMemoryUsage: 90,
        },
        bottlenecks: ['High error rate', 'Slow response times'],
        recommendations: ['Implement circuit breaker pattern and improve error handling', 'Implement database query optimization and add appropriate indexes'],
        passed: false,
      };

      const report = loadTestingService.generatePerformanceReport([poorLoadTestResult]);

      expect(report.recommendations).contain('Implement database query optimization and add appropriate indexes');
      expect(report.recommendations).contain('Implement circuit breaker pattern and improve error handling');
      expect(report.recommendations.some((r: string) => r.includes('optimization'))).equal(true);
    });

    it('should validate report structure', () => {
      const mockLoadTestResult: LoadTestResult = {
        summary: {
          totalRequests: 100,
          totalErrors: 5,
          averageResponseTime: 200,
          minResponseTime: 50,
          maxResponseTime: 1000,
          p95ResponseTime: 400,
          p99ResponseTime: 600,
          throughput: 10,
          errorRate: 0.05,
          testDuration: 10,
        },
        endpoints: [
          {
            url: 'http://localhost/api/test',
            method: 'GET',
            requests: 100,
            errors: 5,
            avgResponseTime: 200,
            errorRate: 0.05,
          },
        ],
        systemMetrics: {
          avgCpuUsage: 40,
          maxCpuUsage: 60,
          avgMemoryUsage: 50,
          maxMemoryUsage: 70,
        },
        bottlenecks: [],
        recommendations: [],
        passed: true,
      };

      const report = loadTestingService.generatePerformanceReport([mockLoadTestResult]);

      expect(report).haveOwnProperty('overall');
      expect(report).haveOwnProperty('trends');
      expect(report).haveOwnProperty('recommendations');
      expect(report).haveOwnProperty('scalability');
      expect(typeof report.overall.summary.totalRequests).equal('number');
      expect(Array.isArray(report.recommendations)).equal(true);
    });
  });
});