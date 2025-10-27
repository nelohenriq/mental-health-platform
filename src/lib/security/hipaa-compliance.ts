import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface HIPAAEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
}

export interface DataAccessLog {
  id: string;
  userId: string;
  accessorId: string;
  accessorRole: 'user' | 'therapist' | 'admin' | 'system';
  resourceType: string;
  resourceId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  purpose: string;
  authorized: boolean;
  encryptedData?: string;
}

export interface AuditTrail {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  actorId: string;
  actorRole: string;
  ipAddress: string;
  userAgent: string;
  checksum: string;
}

export class HIPAAComplianceManager {
  private readonly encryptionKey: string;
  private readonly auditRetentionDays = 2555; // 7 years as required by HIPAA

  constructor() {
    this.encryptionKey = process.env.HIPAA_ENCRYPTION_KEY || 'default-key-change-in-production';
    if (this.encryptionKey === 'default-key-change-in-production') {
      console.warn('WARNING: Using default HIPAA encryption key. Change in production!');
    }
  }

  /**
   * Encrypt sensitive health data
   */
  encryptData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('')); // Set AAD if needed, but empty for now

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Store IV and auth tag with encrypted data
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt sensitive health data
   */
  decryptData(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);

    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAAD(Buffer.from('')); // Set AAD if needed, but empty for now
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Log HIPAA-compliant audit event
   */
  async logAuditEvent(event: Omit<HIPAAEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: HIPAAEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // In production, store in secure audit database
    console.log('HIPAA Audit Event:', {
      ...auditEvent,
      // Mask sensitive details in logs
      details: auditEvent.details ? '[REDACTED]' : undefined,
    });

    // Store in database (simplified - in production use dedicated audit DB)
    try {
      await prisma.auditLog.create({
        data: {
          userId: auditEvent.userId,
          action: auditEvent.action,
          resource: auditEvent.resource,
          resourceId: auditEvent.resourceId,
          ipAddress: auditEvent.ipAddress,
          userAgent: auditEvent.userAgent,
          outcome: auditEvent.outcome,
          details: auditEvent.details ? JSON.stringify(auditEvent.details) : null,
        },
      });
    } catch (error) {
      console.error('Failed to store audit event:', error);
      // In production, this should trigger alerts
    }
  }

  /**
   * Log data access for compliance
   */
  async logDataAccess(access: Omit<DataAccessLog, 'id' | 'timestamp'>): Promise<void> {
    const dataAccess: DataAccessLog = {
      ...access,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Encrypt sensitive data if present
    if (dataAccess.encryptedData) {
      dataAccess.encryptedData = this.encryptData(dataAccess.encryptedData);
    }

    // Store access log
    try {
      await prisma.dataAccessLog.create({
        data: {
          userId: dataAccess.userId,
          accessorId: dataAccess.accessorId,
          accessorRole: dataAccess.accessorRole,
          resourceType: dataAccess.resourceType,
          resourceId: dataAccess.resourceId,
          action: dataAccess.action,
          ipAddress: dataAccess.ipAddress,
          userAgent: dataAccess.userAgent,
          purpose: dataAccess.purpose,
          authorized: dataAccess.authorized,
          encryptedData: dataAccess.encryptedData,
        },
      });
    } catch (error) {
      console.error('Failed to store data access log:', error);
    }
  }

  /**
   * Check if data access is authorized
   */
  async checkDataAccessAuthorization(
    userId: string,
    accessorId: string,
    accessorRole: string,
    resourceType: string,
    action: string,
    purpose: string
  ): Promise<boolean> {
    // HIPAA Authorization Rules
    const rules = {
      // Users can access their own data
      userOwnData: accessorId === userId && accessorRole === 'user',

      // Therapists can access patient data for treatment
      therapistAccess: accessorRole === 'therapist' && purpose === 'treatment',

      // Admins can access for system administration
      adminAccess: accessorRole === 'admin' && ['system_admin', 'compliance'].includes(purpose),

      // Emergency access for crisis situations
      emergencyAccess: purpose === 'emergency_response',
    };

    const authorized = rules.userOwnData || rules.therapistAccess || rules.adminAccess || rules.emergencyAccess;

    // Log the access attempt
    await this.logDataAccess({
      userId,
      accessorId,
      accessorRole: accessorRole as any,
      resourceType,
      resourceId: userId, // Simplified
      action: action as any,
      ipAddress: 'system', // Would be from request
      userAgent: 'system',
      purpose,
      authorized,
    });

    return authorized;
  }

  /**
   * Create audit trail entry with integrity protection
   */
  async createAuditTrail(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
    actorId: string,
    actorRole: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const eventString = JSON.stringify({
      userId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      actorId,
      actorRole,
    });

    const checksum = crypto.createHash('sha256').update(eventString).digest('hex');

    const auditTrail: AuditTrail = {
      id: crypto.randomUUID(),
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
      actorId,
      actorRole,
      ipAddress,
      userAgent,
      checksum,
    };

    // Store audit trail (in production, use tamper-proof storage)
    try {
      await prisma.auditTrail.create({
        data: {
          userId: auditTrail.userId,
          eventType: auditTrail.eventType,
          eventData: JSON.stringify(auditTrail.eventData),
          actorId: auditTrail.actorId,
          actorRole: auditTrail.actorRole,
          ipAddress: auditTrail.ipAddress,
          userAgent: auditTrail.userAgent,
          checksum: auditTrail.checksum,
        },
      });
    } catch (error) {
      console.error('Failed to store audit trail:', error);
    }
  }

  /**
   * Verify audit trail integrity
   */
  async verifyAuditTrailIntegrity(trailId: string): Promise<boolean> {
    const trail = await prisma.auditTrail.findUnique({
      where: { id: trailId },
    });

    if (!trail) return false;

    const eventString = JSON.stringify({
      userId: trail.userId,
      eventType: trail.eventType,
      eventData: JSON.parse(trail.eventData),
      timestamp: trail.timestamp.toISOString(),
      actorId: trail.actorId,
      actorRole: trail.actorRole,
    });

    const calculatedChecksum = crypto.createHash('sha256').update(eventString).digest('hex');

    return calculatedChecksum === trail.checksum;
  }

  /**
   * Get compliance report for a user
   */
  async getComplianceReport(userId: string, startDate: Date, endDate: Date): Promise<{
    accessLog: DataAccessLog[];
    auditEvents: HIPAAEvent[];
    dataRetention: {
      compliant: boolean;
      oldestRecord: Date | null;
      recordsToDelete: number;
    };
  }> {
    // Get access logs
    const accessLogs = await prisma.dataAccessLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Get audit events
    const auditEvents = await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Check data retention compliance
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    const oldRecords = await prisma.auditLog.count({
      where: {
        userId,
        timestamp: { lt: sevenYearsAgo },
      },
    });

    const oldestRecord = await prisma.auditLog.findFirst({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });

    return {
      accessLog: accessLogs.map(log => ({
        ...log,
        accessorRole: log.accessorRole as 'user' | 'therapist' | 'admin' | 'system',
        action: log.action as 'create' | 'read' | 'update' | 'delete' | 'export',
        encryptedData: log.encryptedData ? '[ENCRYPTED]' : undefined,
      })),
      auditEvents: auditEvents.map(event => ({
        ...event,
        resourceId: event.resourceId || undefined,
        outcome: event.outcome as 'success' | 'failure',
        details: event.details ? JSON.parse(event.details) : undefined,
      })),
      dataRetention: {
        compliant: oldRecords === 0,
        oldestRecord: oldestRecord?.timestamp || null,
        recordsToDelete: oldRecords,
      },
    };
  }

  /**
   * Emergency data access (break-glass procedure)
   */
  async emergencyDataAccess(
    userId: string,
    requesterId: string,
    requesterRole: string,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    authorized: boolean;
    token: string | null;
    expiresAt: Date | null;
  }> {
    // Emergency access requires specific conditions
    const canAccess = ['therapist', 'admin'].includes(requesterRole) && reason.includes('emergency');

    if (canAccess) {
      // Generate temporary access token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Log emergency access
      await this.createAuditTrail(
        userId,
        'emergency_access_granted',
        { reason, requesterId, requesterRole },
        requesterId,
        requesterRole,
        ipAddress,
        userAgent
      );

      return {
        authorized: true,
        token,
        expiresAt,
      };
    }

    // Log denied emergency access attempt
    await this.createAuditTrail(
      userId,
      'emergency_access_denied',
      { reason, requesterId, requesterRole },
      requesterId,
      requesterRole,
      ipAddress,
      userAgent
    );

    return {
      authorized: false,
      token: null,
      expiresAt: null,
    };
  }

  /**
   * Clean up old audit data (data retention compliance)
   */
  async cleanupOldAuditData(): Promise<{
    deletedRecords: number;
    retentionPeriodDays: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.auditRetentionDays);

    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    const deletedAccessLogs = await prisma.dataAccessLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    const deletedTrails = await prisma.auditTrail.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    const totalDeleted = deletedAuditLogs.count + deletedAccessLogs.count + deletedTrails.count;

    console.log(`Cleaned up ${totalDeleted} old audit records (retention: ${this.auditRetentionDays} days)`);

    return {
      deletedRecords: totalDeleted,
      retentionPeriodDays: this.auditRetentionDays,
    };
  }
}

// Global HIPAA compliance instance
export const hipaaCompliance = new HIPAAComplianceManager();