export interface CrisisIndicator {
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  response: {
    immediate_action: string;
    follow_up: string[];
  };
}

const crisisIndicators: CrisisIndicator[] = [
  {
    keywords: ['suicide', 'suicidal', 'kill myself', 'end it all', 'not worth living'],
    severity: 'critical',
    threshold: 90,
    response: {
      immediate_action: 'Call emergency services immediately',
      follow_up: [
        'Contact crisis hotline: 988 (US) or local emergency services',
        'Remove access to means of self-harm',
        'Stay with the person until help arrives'
      ]
    }
  },
  {
    keywords: ['self-harm', 'cutting', 'burning', 'hurting myself'],
    severity: 'high',
    threshold: 75,
    response: {
      immediate_action: 'Create a safety plan and remove harmful objects',
      follow_up: [
        'Contact mental health professional',
        'Use distraction techniques',
        'Reach out to trusted support person'
      ]
    }
  },
  {
    keywords: ['overdose', 'pills', 'poison', 'kill myself with'],
    severity: 'critical',
    threshold: 95,
    response: {
      immediate_action: 'Call poison control or emergency services',
      follow_up: [
        'Induce vomiting if appropriate (follow medical advice)',
        'Monitor vital signs',
        'Seek immediate medical attention'
      ]
    }
  },
  {
    keywords: ['hopeless', 'no point', 'give up', 'tired of living'],
    severity: 'high',
    threshold: 70,
    response: {
      immediate_action: 'Validate feelings and encourage professional help',
      follow_up: [
        'Contact therapist or counselor',
        'Consider hospitalization if severe',
        'Build support network'
      ]
    }
  },
  {
    keywords: ['panic attack', 'can\'t breathe', 'heart racing', 'dying'],
    severity: 'medium',
    threshold: 50,
    response: {
      immediate_action: 'Practice grounding techniques',
      follow_up: [
        'Use 4-7-8 breathing method',
        'Focus on present moment',
        'Contact healthcare provider if persistent'
      ]
    }
  },
  {
    keywords: ['depressed', 'worthless', 'failure', 'hate myself'],
    severity: 'medium',
    threshold: 45,
    response: {
      immediate_action: 'Practice self-compassion',
      follow_up: [
        'Engage in pleasurable activities',
        'Challenge negative thoughts',
        'Seek therapy support'
      ]
    }
  }
];

export function detectCrisis(text: string, context?: {
  userHistory?: string[];
  moodLevel?: number;
  previousCrisisEvents?: number;
}): {
  detected: boolean;
  indicators: CrisisIndicator[];
  highestSeverity: 'low' | 'medium' | 'high' | 'critical' | null;
  overallThreshold: number;
  riskScore: number; // New: calculated risk score
  recommendedActions: string[];
} {
  const lowerText = text.toLowerCase();
  let overallThreshold = 0;
  const detectedIndicators: CrisisIndicator[] = [];

  for (const indicator of crisisIndicators) {
    const hasKeyword = indicator.keywords.some((keyword: string) =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      detectedIndicators.push(indicator);
      overallThreshold = Math.max(overallThreshold, indicator.threshold);
    }
  }

  // Calculate risk score based on multiple factors
  let riskScore = overallThreshold;

  // Factor in context
  if (context) {
    // Recent crisis history increases risk
    if (context.previousCrisisEvents && context.previousCrisisEvents > 0) {
      riskScore += context.previousCrisisEvents * 10;
    }

    // Low mood level increases risk
    if (context.moodLevel && context.moodLevel <= 3) {
      riskScore += (4 - context.moodLevel) * 5;
    }

    // Recent negative history increases risk
    if (context.userHistory) {
      const recentNegativePatterns = context.userHistory.filter((h: string) =>
        h.toLowerCase().includes('depressed') ||
        h.toLowerCase().includes('anxious') ||
        h.toLowerCase().includes('suicidal')
      ).length;
      riskScore += recentNegativePatterns * 3;
    }
  }

  // Adjust severity based on risk score
  const severityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  let adjustedSeverity = detectedIndicators.length > 0 ? detectedIndicators.reduce((highest, current) =>
    severityOrder[current.severity] > severityOrder[highest] ? current.severity : highest
  , 'low' as 'low' | 'medium' | 'high' | 'critical') : null;

  if (riskScore >= 90) {
    adjustedSeverity = 'critical';
  } else if (riskScore >= 70 && adjustedSeverity !== 'critical') {
    adjustedSeverity = 'high';
  } else if (riskScore >= 50 && !['critical', 'high'].includes(adjustedSeverity || '')) {
    adjustedSeverity = 'medium';
  }

  if (detectedIndicators.length === 0 && riskScore < 30) {
    return {
      detected: false,
      indicators: [],
      highestSeverity: null,
      overallThreshold: 0,
      riskScore: riskScore,
      recommendedActions: []
    };
  }

  // Collect all recommended actions
  const recommendedActions = detectedIndicators.flatMap(indicator => [
    indicator.response.immediate_action,
    ...indicator.response.follow_up
  ]);

  return {
    detected: true,
    indicators: detectedIndicators,
    highestSeverity: adjustedSeverity,
    overallThreshold,
    riskScore,
    recommendedActions: [...new Set(recommendedActions)]
  };
}