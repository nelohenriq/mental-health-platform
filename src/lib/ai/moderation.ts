import { prisma } from '@/lib/prisma';

export interface ContentViolation {
  type: 'hate_speech' | 'self_harm' | 'violence' | 'inappropriate' | 'spam' | 'off_topic';
  severity: 'low' | 'medium' | 'high';
  description: string;
  matchedTerms: string[];
  confidence: number;
}

export interface ModerationResult {
  approved: boolean;
  violations: ContentViolation[];
  recommendedAction: 'allow' | 'flag' | 'block' | 'review';
  confidence: number;
}

// Content moderation rules
const moderationRules = {
  hate_speech: {
    keywords: [
      'hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'bigot',
      'supremacist', 'nazi', 'kkk', 'terrorist', 'extremist'
    ],
    severity: 'high' as const,
    action: 'block' as const,
  },
  self_harm: {
    keywords: [
      'self-harm', 'cutting', 'burning', 'overdose', 'suicide method',
      'how to kill myself', 'ways to die', 'suicide techniques'
    ],
    severity: 'high' as const,
    action: 'block' as const,
  },
  violence: {
    keywords: [
      'kill someone', 'murder', 'assault', 'attack', 'weapon', 'bomb',
      'terrorism', 'violent crime', 'harm others'
    ],
    severity: 'high' as const,
    action: 'block' as const,
  },
  inappropriate: {
    keywords: [
      'sexual abuse', 'child abuse', 'exploitation', 'harassment',
      'stalking', 'threats', 'intimidation'
    ],
    severity: 'high' as const,
    action: 'block' as const,
  },
  spam: {
    patterns: [
      /(.)\1{10,}/, // Repeated characters
      /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9\-]+\.[a-z]{2,}(?:\.[a-z]{2,})*\b/gi, // URLs
      /\b\d{10,}\b/g, // Long numbers (potentially phone numbers)
    ],
    severity: 'medium' as const,
    action: 'flag' as const,
  },
  off_topic: {
    keywords: [
      'politics', 'religion', 'election', 'candidate', 'party',
      'god', 'bible', 'church', 'prayer', 'faith'
    ],
    severity: 'low' as const,
    action: 'flag' as const,
  },
};

export function moderateContent(text: string): ModerationResult {
  const violations: ContentViolation[] = [];
  let overallConfidence = 0;

  const lowerText = text.toLowerCase();

  // Check keyword-based rules
  Object.entries(moderationRules).forEach(([type, rule]) => {
    if ('keywords' in rule) {
      const matchedTerms: string[] = [];

      rule.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchedTerms.push(keyword);
        }
      });

      if (matchedTerms.length > 0) {
        violations.push({
          type: type as ContentViolation['type'],
          severity: rule.severity,
          description: `${type.replace('_', ' ')} detected`,
          matchedTerms,
          confidence: Math.min(matchedTerms.length * 0.3, 1.0),
        });
      }
    }
  });

  // Check pattern-based rules
  Object.entries(moderationRules).forEach(([type, rule]) => {
    if ('patterns' in rule) {
      const matchedTerms: string[] = [];

      rule.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matchedTerms.push(...matches);
        }
      });

      if (matchedTerms.length > 0) {
        violations.push({
          type: type as ContentViolation['type'],
          severity: rule.severity,
          description: `${type.replace('_', ' ')} pattern detected`,
          matchedTerms,
          confidence: 0.8,
        });
      }
    }
  });

  // Determine overall result
  let approved = true;
  let recommendedAction: ModerationResult['recommendedAction'] = 'allow';

  if (violations.length > 0) {
    const highSeverityViolations = violations.filter(v => v.severity === 'high');
    const mediumSeverityViolations = violations.filter(v => v.severity === 'medium');

    if (highSeverityViolations.length > 0) {
      approved = false;
      recommendedAction = 'block';
      overallConfidence = Math.max(...highSeverityViolations.map(v => v.confidence));
    } else if (mediumSeverityViolations.length > 0) {
      approved = false;
      recommendedAction = 'flag';
      overallConfidence = Math.max(...mediumSeverityViolations.map(v => v.confidence));
    } else {
      recommendedAction = 'flag';
      overallConfidence = Math.max(...violations.map(v => v.confidence));
    }
  }

  return {
    approved,
    violations,
    recommendedAction,
    confidence: overallConfidence,
  };
}

export async function logModerationAction(
  userId: string,
  contentType: 'message' | 'profile' | 'post',
  contentId: string,
  result: ModerationResult
): Promise<void> {
  // Log moderation actions for review
  console.log('Content moderation:', {
    userId,
    contentType,
    contentId,
    approved: result.approved,
    violations: result.violations.length,
    action: result.recommendedAction,
    confidence: result.confidence,
  });

  // TODO: Store moderation logs in database for analytics and review
  // This would help improve the moderation system over time
}

export function getModerationGuidelines(): string {
  return `
Content Moderation Guidelines:

✅ ALLOWED:
- Personal mental health discussions
- Sharing feelings and experiences
- Seeking advice about therapy/counseling
- General wellness topics
- Supportive and empathetic responses

🚫 BLOCKED (High Priority):
- Hate speech, discrimination, bigotry
- Self-harm or suicide instructions
- Violence, threats, or harm to others
- Sexual abuse or exploitation content
- Harassment or intimidation

⚠️ FLAGGED (Medium Priority):
- Spam content or excessive repetition
- Sharing personal contact information
- Off-topic political or religious discussions
- Inappropriate or triggering content

📝 GUIDELINES:
- Content is reviewed for user safety first
- Therapeutic context is considered
- False positives may occur - flagged content can be reviewed
- Users can appeal moderation decisions
- Moderation helps maintain a safe, supportive environment
  `;
}

export function generateModerationResponse(result: ModerationResult): string {
  if (result.approved) {
    return '';
  }

  const highSeverity = result.violations.filter(v => v.severity === 'high');
  const mediumSeverity = result.violations.filter(v => v.severity === 'medium');

  if (highSeverity.length > 0) {
    return `I'm sorry, but I can't respond to that type of content as it may violate our community guidelines for safety. If you're experiencing a crisis or need immediate help, please contact emergency services or a crisis hotline. You can find resources at [crisis resources link].`;
  }

  if (mediumSeverity.length > 0) {
    return `I've flagged this message for review by our moderation team. In the meantime, I'd like to help you with mental health and wellness topics. What would you like to talk about today?`;
  }

  return `I want to keep our conversation focused on mental health and wellness support. If you'd like to talk about something else, I'm here to listen and provide supportive guidance.`;
}