import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['mood_entry', 'cbt_session', 'crisis_detected', 'wearable_sync'])),
  secret: z.string().min(16), // Webhook secret for verification
});

const webhookPayloadSchema = z.object({
  event: z.string(),
  userId: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
});

// POST /api/public/v1/webhooks - Register webhook endpoint
export async function POST(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = registerWebhookSchema.parse(body);

    // Store webhook configuration (in production, this would be in database)
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock storage - in production, save to database
    console.log(`Registered webhook ${webhookId}:`, validatedData);

    return NextResponse.json({
      webhookId,
      url: validatedData.url,
      events: validatedData.events,
      status: 'active',
      createdAt: new Date(),
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error registering webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Webhook delivery function (called internally when events occur)
export async function deliverWebhook(
  webhookUrl: string,
  webhookSecret: string,
  event: string,
  userId: string,
  data: any
): Promise<boolean> {
  try {
    const payload = {
      event,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    // Create signature for verification
    const signature = createWebhookSignature(JSON.stringify(payload), webhookSecret);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'User-Agent': 'MentalHealthPlatform-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`Webhook delivered successfully to ${webhookUrl} for event ${event}`);
      return true;
    } else {
      console.error(`Webhook delivery failed to ${webhookUrl}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error(`Webhook delivery error to ${webhookUrl}:`, error);
    return false;
  }
}

// Webhook event triggers (called from various parts of the application)
export class WebhookService {
  private webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
  }> = [];

  registerWebhook(id: string, url: string, events: string[], secret: string): void {
    this.webhooks.push({
      id,
      url,
      events,
      secret,
      isActive: true,
    });
  }

  unregisterWebhook(id: string): void {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index !== -1) {
      this.webhooks.splice(index, 1);
    }
  }

  async triggerEvent(event: string, userId: string, data: any): Promise<void> {
    const relevantWebhooks = this.webhooks.filter(
      w => w.isActive && w.events.includes(event)
    );

    for (const webhook of relevantWebhooks) {
      // Deliver webhook asynchronously
      setImmediate(() => {
        deliverWebhook(webhook.url, webhook.secret, event, userId, data);
      });
    }
  }

  // Specific event triggers
  async onMoodEntryCreated(userId: string, moodEntry: any): Promise<void> {
    await this.triggerEvent('mood_entry', userId, {
      type: 'created',
      moodEntry: {
        id: moodEntry.id,
        moodLevel: moodEntry.moodLevel,
        notes: moodEntry.notes,
        factors: moodEntry.factors,
        timestamp: moodEntry.timestamp,
      },
    });
  }

  async onCBTSessionCompleted(userId: string, session: any): Promise<void> {
    await this.triggerEvent('cbt_session', userId, {
      type: 'completed',
      session: {
        id: session.id,
        exerciseId: session.exerciseId,
        progress: session.progress,
        score: session.score,
        completedAt: session.completedAt,
      },
    });
  }

  async onCrisisDetected(userId: string, crisisEvent: any): Promise<void> {
    await this.triggerEvent('crisis_detected', userId, {
      type: 'detected',
      crisisEvent: {
        id: crisisEvent.id,
        source: crisisEvent.source,
        flagLevel: crisisEvent.flagLevel,
        detectedAt: crisisEvent.detectedAt,
      },
    });
  }

  async onWearableDataSynced(userId: string, wearableData: any): Promise<void> {
    await this.triggerEvent('wearable_sync', userId, {
      type: 'synced',
      wearableData: {
        provider: wearableData.provider,
        insights: wearableData.insights,
        syncedAt: wearableData.syncedAt,
      },
    });
  }
}

// Global webhook service instance
export const webhookService = new WebhookService();

// Helper function to create webhook signature
function createWebhookSignature(payload: string, secret: string): string {
  // In production, use proper HMAC-SHA256
  // For now, return a simple hash
  let hash = 0;
  const combined = payload + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256=${Math.abs(hash).toString(16)}`;
}

// Webhook verification middleware (for receiving webhooks from external services)
export async function verifyWebhookSignature(
  request: NextRequest,
  secret: string
): Promise<boolean> {
  const signature = request.headers.get('x-webhook-signature');
  if (!signature) return false;

  const body = await request.text();
  const expectedSignature = createWebhookSignature(body, secret);

  return signature === expectedSignature;
}