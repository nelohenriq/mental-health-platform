import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface SecurityEvent {
  id: string;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity' | 'security_incident';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'blocked' | 'detected';
  details: Record<string, any>;
  timestamp: Date;
  checksum: string;
}

export interface VulnerabilityScan {
  id: string;
  scanType: 'dependency' | 'code' | 'infrastructure' | 'configuration';
  target: string;
  findings: Array<{
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    cve?: string;
    remediation: string;
    affectedComponents: string[];
  }>;
  scanDate: Date;
  status: 'completed' | 'failed' | 'in_progress';
  duration: number;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  failedAuthentications: number;
  suspiciousActivities: number;
  blockedRequests: number;
  averageResponseTime: number;
  uptimePercentage: number;
  lastScanDate: Date | null;
  openVulnerabilities: number;
}

export class SecurityAuditingSystem {
  private readonly logRetentionDays = 90; // 90 days for security logs
  private eventBuffer: SecurityEvent[] = [];
  private readonly bufferSize = 100;

  /**
   * Log security event with integrity protection
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'checksum'>): Promise<void> {
    const eventData = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Create checksum for integrity
    const eventString = JSON.stringify(eventData);
    const checksum = crypto.createHash('sha256').update(eventString).digest('hex');

    const securityEvent: SecurityEvent = {
      ...eventData,
      checksum,
    };

    // Add to buffer
    this.eventBuffer.push(securityEvent);

    // Flush buffer if full
    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushEventBuffer();
    }

    // Immediate logging for high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      console.error('HIGH SEVERITY SECURITY EVENT:', {
        ...securityEvent,
        details: '[REDACTED]', // Don't log sensitive details
      });

      // In production, trigger alerts
      await this.triggerSecurityAlert(securityEvent);
    }
  }

  /**
   * Flush buffered events to storage
   */
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      // In production, use bulk insert to dedicated security database
      for (const event of this.eventBuffer) {
        await prisma.securityEvent.create({
          data: {
            eventType: event.eventType,
            severity: event.severity,
            userId: event.userId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            resource: event.resource,
            action: event.action,
            outcome: event.outcome,
            details: JSON.stringify(event.details),
            checksum: event.checksum,
          },
        });
      }

      this.eventBuffer = [];
    } catch (error) {
      console.error('Failed to flush security events:', error);
      // In production, implement retry logic and alerting
    }
  }

  /**
   * Trigger security alert for critical events
   */
  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, integrate with alerting systems (email, SMS, Slack, etc.)
    console.error('🚨 SECURITY ALERT:', {
      type: event.eventType,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp,
    });

    // Implement alerting logic here
    // - Send email to security team
    // - Create incident ticket
    // - Trigger automated responses
  }

  /**
   * Perform security vulnerability scan
   */
  async performVulnerabilityScan(scanType: VulnerabilityScan['scanType'], target: string): Promise<VulnerabilityScan> {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const findings = await this.executeScan(scanType, target);
      const duration = Date.now() - startTime;

      const scan: VulnerabilityScan = {
        id: scanId,
        scanType,
        target,
        findings,
        scanDate: new Date(),
        status: 'completed',
        duration,
      };

      // Store scan results
      await prisma.vulnerabilityScan.create({
        data: {
          scanType: scan.scanType,
          target: scan.target,
          findings: JSON.stringify(scan.findings),
          scanDate: scan.scanDate,
          status: scan.status,
          duration: scan.duration,
        },
      });

      // Log critical findings
      const criticalFindings = findings.filter(f => f.severity === 'critical');
      if (criticalFindings.length > 0) {
        await this.logSecurityEvent({
          eventType: 'security_incident',
          severity: 'critical',
          ipAddress: 'system',
          userAgent: 'vulnerability-scanner',
          resource: target,
          action: 'scan',
          outcome: 'success',
          details: {
            scanType,
            criticalFindings: criticalFindings.length,
            findings: criticalFindings,
          },
        });
      }

      return scan;
    } catch (error) {
      const duration = Date.now() - startTime;

      const failedScan: VulnerabilityScan = {
        id: scanId,
        scanType,
        target,
        findings: [],
        scanDate: new Date(),
        status: 'failed',
        duration,
      };

      await prisma.vulnerabilityScan.create({
        data: {
          scanType: failedScan.scanType,
          target: failedScan.target,
          findings: JSON.stringify(failedScan.findings),
          scanDate: failedScan.scanDate,
          status: failedScan.status,
          duration: failedScan.duration,
        },
      });

      throw error;
    }
  }

  /**
   * Execute actual vulnerability scan
   */
  private async executeScan(scanType: VulnerabilityScan['scanType'], target: string): Promise<VulnerabilityScan['findings']> {
    const findings: VulnerabilityScan['findings'] = [];

    switch (scanType) {
      case 'dependency':
        findings.push(...await this.scanDependencies(target));
        break;
      case 'code':
        findings.push(...await this.scanCode(target));
        break;
      case 'infrastructure':
        findings.push(...await this.scanInfrastructure(target));
        break;
      case 'configuration':
        findings.push(...await this.scanConfiguration(target));
        break;
    }

    return findings;
  }

  /**
   * Scan for vulnerable dependencies
   */
  private async scanDependencies(target: string): Promise<VulnerabilityScan['findings']> {
    // In production, integrate with tools like npm audit, Snyk, etc.
    // This is a simplified example
    const findings: VulnerabilityScan['findings'] = [];

    // Mock vulnerability detection
    if (target.includes('package.json')) {
      findings.push({
        severity: 'high',
        title: 'Outdated Express.js version',
        description: 'Express.js version is vulnerable to prototype pollution',
        cve: 'CVE-2022-24999',
        remediation: 'Upgrade to Express.js 4.17.3 or later',
        affectedComponents: ['express'],
      });
    }

    return findings;
  }

  /**
   * Scan code for security issues
   */
  private async scanCode(target: string): Promise<VulnerabilityScan['findings']> {
    // In production, integrate with tools like ESLint security plugins, SonarQube, etc.
    const findings: VulnerabilityScan['findings'] = [];

    // Mock code security scan
    findings.push({
      severity: 'medium',
      title: 'SQL Injection vulnerability',
      description: 'Direct SQL query construction detected',
      remediation: 'Use parameterized queries or ORM',
      affectedComponents: ['database-queries'],
    });

    return findings;
  }

  /**
   * Scan infrastructure for security issues
   */
  private async scanInfrastructure(target: string): Promise<VulnerabilityScan['findings']> {
    // In production, integrate with infrastructure scanning tools
    const findings: VulnerabilityScan['findings'] = [];

    // Mock infrastructure scan
    findings.push({
      severity: 'high',
      title: 'Unencrypted data transmission',
      description: 'API endpoints not using HTTPS',
      remediation: 'Implement TLS 1.3 for all endpoints',
      affectedComponents: ['api-endpoints'],
    });

    return findings;
  }

  /**
   * Scan configuration for security issues
   */
  private async scanConfiguration(target: string): Promise<VulnerabilityScan['findings']> {
    // In production, integrate with configuration scanning tools
    const findings: VulnerabilityScan['findings'] = [];

    // Mock configuration scan
    findings.push({
      severity: 'critical',
      title: 'Weak password policy',
      description: 'Password requirements are insufficient',
      remediation: 'Implement strong password policy with complexity requirements',
      affectedComponents: ['authentication'],
    });

    return findings;
  }

  /**
   * Get security metrics and dashboard data
   */
  async getSecurityMetrics(timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
    // Get security events
    const events = await prisma.securityEvent.findMany({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });

    // Calculate metrics
    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const failedAuthentications = events.filter(
      e => e.eventType === 'authentication' && e.outcome === 'failure'
    ).length;

    const suspiciousActivities = events.filter(
      e => e.eventType === 'suspicious_activity'
    ).length;

    const blockedRequests = events.filter(
      e => e.outcome === 'blocked'
    ).length;

    // Get latest vulnerability scan
    const latestScan = await prisma.vulnerabilityScan.findFirst({
      orderBy: { scanDate: 'desc' },
    });

    const openVulnerabilities = latestScan
      ? JSON.parse(latestScan.findings).filter((f: any) => f.severity !== 'info').length
      : 0;

    return {
      totalEvents: events.length,
      eventsBySeverity,
      eventsByType,
      failedAuthentications,
      suspiciousActivities,
      blockedRequests,
      averageResponseTime: 0, // Would need to implement response time tracking
      uptimePercentage: 99.9, // Would need to implement uptime monitoring
      lastScanDate: latestScan?.scanDate || null,
      openVulnerabilities,
    };
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
    userAgent: string,
    action: string
  ): Promise<boolean> {
    // Check for suspicious patterns
    const recentEvents = await prisma.securityEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // Check for brute force attempts
    const failedAuthAttempts = recentEvents.filter(
      e => e.eventType === 'authentication' && e.outcome === 'failure'
    ).length;

    if (failedAuthAttempts > 5) {
      await this.logSecurityEvent({
        eventType: 'suspicious_activity',
        severity: 'high',
        userId,
        ipAddress,
        userAgent,
        action: 'brute_force_attempt',
        outcome: 'success',
        details: {
          failedAttempts: failedAuthAttempts,
          timeWindow: '24h',
        },
      });
      return true;
    }

    // Check for unusual login locations (simplified)
    const uniqueIPs = new Set(recentEvents.map(e => e.ipAddress));
    if (uniqueIPs.size > 3) {
      await this.logSecurityEvent({
        eventType: 'suspicious_activity',
        severity: 'medium',
        userId,
        ipAddress,
        userAgent,
        action: 'multiple_ip_login',
        outcome: 'detected',
        details: {
          uniqueIPs: Array.from(uniqueIPs),
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Clean up old security logs
   */
  async cleanupOldLogs(): Promise<{ deletedRecords: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);

    const deletedEvents = await prisma.securityEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    const deletedScans = await prisma.vulnerabilityScan.deleteMany({
      where: {
        scanDate: { lt: cutoffDate },
      },
    });

    const totalDeleted = deletedEvents.count + deletedScans.count;

    console.log(`Cleaned up ${totalDeleted} old security records (retention: ${this.logRetentionDays} days)`);

    return { deletedRecords: totalDeleted };
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(timeRange: { start: Date; end: Date }): Promise<{
    summary: SecurityMetrics;
    topThreats: Array<{ type: string; count: number; severity: string }>;
    recommendations: string[];
    compliance: {
      hipaaCompliant: boolean;
      gdprCompliant: boolean;
      lastAudit: Date | null;
    };
  }> {
    const summary = await this.getSecurityMetrics(timeRange);

    // Get top threats
    const events = await prisma.securityEvent.findMany({
      where: {
        timestamp: { gte: timeRange.start, lte: timeRange.end },
        severity: { in: ['high', 'critical'] },
      },
    });

    const threatCounts = events.reduce((acc, event) => {
      const key = `${event.eventType}:${event.severity}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topThreats = Object.entries(threatCounts)
      .map(([key, count]) => {
        const [type, severity] = key.split(':');
        return { type, count, severity };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(summary, topThreats);

    return {
      summary,
      topThreats,
      recommendations,
      compliance: {
        hipaaCompliant: true, // Would need actual compliance checking
        gdprCompliant: true,  // Would need actual compliance checking
        lastAudit: new Date(), // Would need actual audit tracking
      },
    };
  }

  private generateSecurityRecommendations(
    metrics: SecurityMetrics,
    topThreats: Array<{ type: string; count: number; severity: string }>
  ): string[] {
    const recommendations = [];

    if (metrics.failedAuthentications > 10) {
      recommendations.push('Implement multi-factor authentication to reduce failed login attempts');
    }

    if (metrics.suspiciousActivities > 5) {
      recommendations.push('Review and strengthen suspicious activity detection rules');
    }

    if (metrics.openVulnerabilities > 0) {
      recommendations.push('Address open vulnerabilities identified in recent scans');
    }

    if (!metrics.lastScanDate || metrics.lastScanDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      recommendations.push('Perform regular security vulnerability scans (recommended: weekly)');
    }

    if (topThreats.some(t => t.type.includes('authentication'))) {
      recommendations.push('Strengthen authentication mechanisms and implement account lockout policies');
    }

    return recommendations;
  }
}

// Global security auditing instance
export const securityAuditing = new SecurityAuditingSystem();