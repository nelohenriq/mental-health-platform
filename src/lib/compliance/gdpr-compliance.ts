import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  justification?: string;
  requesterInfo: {
    name?: string;
    email?: string;
    relationship?: string;
  };
  responseData?: any;
  processedBy?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  consented: boolean;
  consentedAt?: Date;
  withdrawnAt?: Date;
  version: string;
  ipAddress: string;
  userAgent: string;
  legalBasis?: 'consent' | 'contract' | 'legitimate_interest' | 'legal_obligation' | 'vital_interest' | 'public_task';
}

export interface DataProcessingRecord {
  id: string;
  userId: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: number; // days
  processingStarted: Date;
  processingEnded?: Date;
  automatedDecisionMaking: boolean;
  dataTransfers: {
    country: string;
    safeguards: string[];
  }[];
}

export interface GDPRComplianceReport {
  dataSubjectRequests: {
    total: number;
    pending: number;
    completed: number;
    averageProcessingTime: number;
  };
  consentManagement: {
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
    consentByType: Record<string, number>;
  };
  dataProcessing: {
    activeProcessingActivities: number;
    dataTransfers: number;
    automatedDecisions: number;
  };
  compliance: {
    gdprCompliant: boolean;
    issues: string[];
    recommendations: string[];
  };
}

export class GDPRComplianceManager {
  private readonly retentionPeriods = {
    userData: 2555, // 7 years for health data
    auditLogs: 2555,
    consentRecords: 2555,
    anonymizedAnalytics: 2555,
  };

  /**
   * Handle data subject access request (DSAR)
   */
  async submitDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRequest['requestType'],
    requesterInfo: DataSubjectRequest['requesterInfo'],
    justification?: string
  ): Promise<DataSubjectRequest> {
    // Verify identity (simplified - in production, use strong verification)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      userId,
      requestType,
      status: 'pending',
      requestedAt: new Date(),
      requesterInfo,
      justification,
    };

    // Store request
    await prisma.dataSubjectRequest.create({
      data: {
        userId: request.userId,
        requestType: request.requestType,
        status: request.status,
        requestedAt: request.requestedAt,
        justification: request.justification,
        requesterInfo: JSON.stringify(request.requesterInfo),
      },
    });

    // Log the request
    await this.logGDPRActivity(userId, 'data_subject_request_submitted', {
      requestId: request.id,
      requestType,
      requesterInfo,
    });

    // Auto-process certain requests if possible
    if (requestType === 'access') {
      setImmediate(() => this.processAccessRequest(request.id));
    }

    return request;
  }

  /**
   * Process data access request
   */
  private async processAccessRequest(requestId: string): Promise<void> {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'pending') return;

    try {
      // Update status to processing
      await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });

      // Collect all user data
      const userData = await this.collectUserData(request.userId);

      // Update request with response
      await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          responseData: JSON.stringify(userData),
        },
      });

      // Log completion
      await this.logGDPRActivity(request.userId, 'data_subject_request_completed', {
        requestId,
        requestType: 'access',
      });

    } catch (error) {
      console.error('Failed to process access request:', error);
      await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });
    }
  }

  /**
   * Collect all user data for access request
   */
  private async collectUserData(userId: string): Promise<any> {
    const [user, moodEntries, conversations, cbtSessions, crisisEvents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          privacyMode: true,
          onboardingCompleted: true,
        },
      }),
      prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
        orderBy: { startAt: 'desc' },
      }),
      prisma.cBTSession.findMany({
        where: { userId },
        include: {
          exercise: true,
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.crisisEvent.findMany({
        where: { userId },
        orderBy: { detectedAt: 'desc' },
      }),
    ]);

    return {
      user,
      moodEntries,
      conversations,
      cbtSessions,
      crisisEvents,
      dataCollectionDate: new Date(),
      retentionInformation: {
        userData: `${this.retentionPeriods.userData} days`,
        auditLogs: `${this.retentionPeriods.auditLogs} days`,
      },
    };
  }

  /**
   * Process data erasure request (right to be forgotten)
   */
  async processErasureRequest(requestId: string, adminUserId: string): Promise<void> {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'pending') return;

    try {
      // Check for legal grounds to refuse erasure
      const canErase = await this.checkErasureEligibility(request.userId);

      if (!canErase.eligible) {
        await prisma.dataSubjectRequest.update({
          where: { id: requestId },
          data: {
            status: 'rejected',
            completedAt: new Date(),
            responseData: JSON.stringify({ reason: canErase.reason }),
          },
        });
        return;
      }

      // Perform erasure
      await this.eraseUserData(request.userId);

      // Update request
      await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          processedBy: adminUserId,
          responseData: JSON.stringify({ erased: true }),
        },
      });

      // Log erasure
      await this.logGDPRActivity(request.userId, 'data_erasure_completed', {
        requestId,
        processedBy: adminUserId,
      });

    } catch (error) {
      console.error('Failed to process erasure request:', error);
      await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });
    }
  }

  /**
   * Check if user data can be erased
   */
  private async checkErasureEligibility(userId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    // Check for legal obligations preventing erasure
    const activeCrisisEvents = await prisma.crisisEvent.count({
      where: {
        userId,
        escalationStatus: { in: ['PENDING', 'ESCALATED'] },
      },
    });

    if (activeCrisisEvents > 0) {
      return {
        eligible: false,
        reason: 'Active crisis intervention requires data retention',
      };
    }

    // Check for ongoing legal proceedings (simplified)
    // In production, integrate with legal case management system

    return { eligible: true };
  }

  /**
   * Perform data erasure
   */
  private async eraseUserData(userId: string): Promise<void> {
    // Soft delete - anonymize instead of hard delete for audit purposes
    const anonymizedData = {
      email: `deleted_${crypto.randomBytes(8).toString('hex')}@anonymized.com`,
      name: 'Deleted User',
      crisisFlag: false,
    };

    await prisma.user.update({
      where: { id: userId },
      data: anonymizedData,
    });

    // Anonymize mood entries
    await prisma.moodEntry.updateMany({
      where: { userId },
      data: {
        notes: 'Anonymized',
        factors: null,
      },
    });

    // Anonymize conversations
    await prisma.conversation.updateMany({
      where: { userId },
      data: {
        sessionContext: null,
      },
    });

    // Anonymize messages
    await prisma.message.updateMany({
      where: {
        conversation: {
          userId,
        },
      },
      data: {
        content: 'Message anonymized',
      },
    });

    console.log(`User data anonymized for user ${userId}`);
  }

  /**
   * Manage user consent
   */
  async manageConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    consented: boolean,
    ipAddress: string,
    userAgent: string,
    legalBasis: ConsentRecord['legalBasis'] = 'consent'
  ): Promise<ConsentRecord> {
    const existingConsent = await prisma.consentRecord.findFirst({
      where: {
        userId,
        consentType,
      },
      orderBy: { consentedAt: 'desc' },
    });

    const consent: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      consentType,
      consented,
      version: '1.0',
      ipAddress,
      userAgent,
      legalBasis,
    };

    if (consented) {
      consent.consentedAt = new Date();
    } else {
      consent.withdrawnAt = new Date();
    }

    // Store consent record
    await prisma.consentRecord.create({
      data: {
        userId: consent.userId,
        consentType: consent.consentType,
        consented: consent.consented,
        consentedAt: consent.consentedAt,
        withdrawnAt: consent.withdrawnAt,
        version: consent.version,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        legalBasis: consent.legalBasis || null,
      },
    });

    // Log consent change
    await this.logGDPRActivity(userId, consented ? 'consent_granted' : 'consent_withdrawn', {
      consentType,
      legalBasis,
    });

    return consent;
  }

  /**
   * Check if user has given consent for specific purpose
   */
  async checkConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    const latestConsent = await prisma.consentRecord.findFirst({
      where: {
        userId,
        consentType,
      },
      orderBy: { consentedAt: 'desc' },
    });

    return latestConsent?.consented === true && !latestConsent.withdrawnAt;
  }

  /**
   * Record data processing activity
   */
  async recordDataProcessing(
    userId: string,
    purpose: string,
    legalBasis: string,
    dataCategories: string[],
    recipients: string[],
    retentionPeriod: number,
    automatedDecisionMaking: boolean = false,
    dataTransfers: DataProcessingRecord['dataTransfers'] = []
  ): Promise<DataProcessingRecord> {
    const processing: DataProcessingRecord = {
      id: crypto.randomUUID(),
      userId,
      purpose,
      legalBasis,
      dataCategories,
      recipients,
      retentionPeriod,
      processingStarted: new Date(),
      automatedDecisionMaking,
      dataTransfers,
    };

    // Store processing record
    await prisma.dataProcessingRecord.create({
      data: {
        userId: processing.userId,
        purpose: processing.purpose,
        legalBasis: processing.legalBasis,
        dataCategories: JSON.stringify(processing.dataCategories),
        recipients: JSON.stringify(processing.recipients),
        retentionPeriod: processing.retentionPeriod,
        processingStarted: processing.processingStarted,
        automatedDecisionMaking: processing.automatedDecisionMaking,
        dataTransfers: JSON.stringify(processing.dataTransfers),
      },
    });

    return processing;
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(timeRange: { start: Date; end: Date }): Promise<GDPRComplianceReport> {
    // Data subject requests
    const dsrStats = await this.getDSRStatistics(timeRange);

    // Consent management
    const consentStats = await this.getConsentStatistics();

    // Data processing
    const processingStats = await this.getProcessingStatistics();

    // Compliance check
    const compliance = await this.checkGDPRCompliance();

    return {
      dataSubjectRequests: dsrStats,
      consentManagement: consentStats,
      dataProcessing: processingStats,
      compliance,
    };
  }

  private async getDSRStatistics(timeRange: { start: Date; end: Date }) {
    const requests = await prisma.dataSubjectRequest.findMany({
      where: {
        requestedAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });

    const completedRequests = requests.filter(r => r.status === 'completed' && r.completedAt);
    const averageProcessingTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) =>
          sum + (r.completedAt!.getTime() - r.requestedAt.getTime()), 0
        ) / completedRequests.length / (1000 * 60 * 60 * 24) // days
      : 0;

    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      completed: completedRequests.length,
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
    };
  }

  private async getConsentStatistics() {
    const consents = await prisma.consentRecord.findMany();

    const activeConsents = consents.filter(c => c.consented && !c.withdrawnAt).length;
    const withdrawnConsents = consents.filter(c => c.withdrawnAt).length;

    const consentByType = consents.reduce((acc, c) => {
      acc[c.consentType] = (acc[c.consentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConsents: consents.length,
      activeConsents,
      withdrawnConsents,
      consentByType,
    };
  }

  private async getProcessingStatistics() {
    const processing = await prisma.dataProcessingRecord.findMany({
      where: {
        processingEnded: null, // Active processing
      },
    });

    const dataTransfers = processing.reduce((sum, p) => {
      const transfers = JSON.parse(p.dataTransfers);
      return sum + transfers.length;
    }, 0);

    const automatedDecisions = processing.filter(p => p.automatedDecisionMaking).length;

    return {
      activeProcessingActivities: processing.length,
      dataTransfers,
      automatedDecisions,
    };
  }

  private async checkGDPRCompliance(): Promise<GDPRComplianceReport['compliance']> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check data subject request processing time (should be < 30 days)
    const recentRequests = await prisma.dataSubjectRequest.findMany({
      where: {
        requestedAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
        },
        status: 'completed',
      },
    });

    const overdueRequests = recentRequests.filter(r => {
      const processingTime = (r.completedAt!.getTime() - r.requestedAt.getTime()) / (1000 * 60 * 60 * 24);
      return processingTime > 30;
    });

    if (overdueRequests.length > 0) {
      issues.push(`${overdueRequests.length} data subject requests exceeded 30-day processing limit`);
      recommendations.push('Implement automated monitoring for request processing deadlines');
    }

    // Check consent management
    const consentsWithoutLegalBasis = await prisma.consentRecord.count({
      where: { legalBasis: null },
    });

    if (consentsWithoutLegalBasis > 0) {
      issues.push(`${consentsWithoutLegalBasis} consent records missing legal basis`);
      recommendations.push('Document legal basis for all consent records');
    }

    // Check data transfers
    const processingRecords = await prisma.dataProcessingRecord.findMany();
    const recordsWithTransfers = processingRecords.filter(r => {
      const transfers = JSON.parse(r.dataTransfers);
      return transfers.length > 0;
    });

    for (const record of recordsWithTransfers) {
      const transfers = JSON.parse(record.dataTransfers);
      for (const transfer of transfers) {
        if (!transfer.safeguards || transfer.safeguards.length === 0) {
          issues.push(`Data transfer to ${transfer.country} missing safeguards`);
          recommendations.push('Implement appropriate safeguards for international data transfers');
        }
      }
    }

    return {
      gdprCompliant: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Log GDPR-related activity
   */
  private async logGDPRActivity(userId: string, activity: string, details: any): Promise<void> {
    // In production, integrate with audit logging system
    console.log(`GDPR Activity: ${activity} for user ${userId}`, details);
  }

  /**
   * Clean up old data according to retention policies
   */
  async cleanupOldData(): Promise<{
    deletedRecords: {
      auditLogs: number;
      consentRecords: number;
      anonymizedAnalytics: number;
    };
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriods.auditLogs);

    // Clean up old audit logs
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    // Clean up old consent records
    const deletedConsents = await prisma.consentRecord.deleteMany({
      where: {
        consentedAt: { lt: cutoffDate },
      },
    });

    // Clean up old anonymized analytics
    const deletedAnalytics = await prisma.anonymizedAnalytics.deleteMany({
      where: {
        anonymizedAt: { lt: cutoffDate },
      },
    });

    return {
      deletedRecords: {
        auditLogs: deletedAuditLogs.count,
        consentRecords: deletedConsents.count,
        anonymizedAnalytics: deletedAnalytics.count,
      },
    };
  }
}

// Global GDPR compliance instance
export const gdprCompliance = new GDPRComplianceManager();