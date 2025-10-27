import { prisma } from '@/lib/prisma';

export interface CrisisIndicator {
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'suicide' | 'self_harm' | 'violence' | 'emergency' | 'distress';
  response: {
    immediate_action: string;
    escalation_level: 'monitor' | 'notify' | 'urgent' | 'emergency';
    follow_up: string[];
  };
}

export const crisisIndicators: CrisisIndicator[] = [
  {
    keywords: ['suicide', 'suicidal', 'kill myself', 'end it all', 'not worth living', 'better off dead'],
    severity: 'critical',
    category: 'suicide',
    response: {
      immediate_action: 'Immediately flag for emergency intervention',
      escalation_level: 'emergency',
      follow_up: [
        'Contact emergency services',
        'Notify crisis intervention team',
        'Block further AI responses until human review',
        'Preserve conversation for evidence'
      ]
    }
  },
  {
    keywords: ['self-harm', 'cutting', 'hurt myself', 'burn myself', 'overdose', 'poison'],
    severity: 'high',
    category: 'self_harm',
    response: {
      immediate_action: 'Flag for urgent human review',
      escalation_level: 'urgent',
      follow_up: [
        'Provide immediate safety resources',
        'Contact crisis hotline',
        'Block self-harm content',
        'Schedule follow-up within 24 hours'
      ]
    }
  },
  {
    keywords: ['kill someone', 'hurt someone', 'violence', 'attack', 'weapon', 'threat'],
    severity: 'high',
    category: 'violence',
    response: {
      immediate_action: 'Flag for immediate human review',
      escalation_level: 'urgent',
      follow_up: [
        'Contact authorities if imminent threat',
        'Block violent content',
        'Preserve evidence',
        'Notify safety team'
      ]
    }
  },
  {
    keywords: ['emergency', 'help me now', 'danger', 'unsafe', 'threatened'],
    severity: 'high',
    category: 'emergency',
    response: {
      immediate_action: 'Escalate to human intervention',
      escalation_level: 'urgent',
      follow_up: [
        'Provide local emergency contacts',
        'Connect to crisis services',
        'Monitor user status',
        'Follow up within hours'
      ]
    }
  },
  {
    keywords: ['panic attack', 'anxiety attack', 'freaking out', 'losing control', 'heart racing'],
    severity: 'medium',
    category: 'distress',
    response: {
      immediate_action: 'Provide immediate coping strategies',
      escalation_level: 'notify',
      follow_up: [
        'Offer grounding techniques',
        'Suggest breathing exercises',
        'Monitor for escalation',
        'Follow up if symptoms persist'
      ]
    }
  },
  {
    keywords: ['depressed', 'hopeless', 'worthless', 'no point', 'give up', 'tired of living'],
    severity: 'medium',
    category: 'distress',
    response: {
      immediate_action: 'Provide supportive response and resources',
      escalation_level: 'monitor',
      follow_up: [
        'Offer depression resources',
        'Suggest professional help',
        'Monitor mood patterns',
        'Encourage safety planning'
      ]
    }
  }
];

export function detectCrisis(text: string): {
  detected: boolean;
  indicators: CrisisIndicator[];
  highestSeverity: 'low' | 'medium' | 'high' | 'critical' | null;
  recommendedActions: string[];
} {
  const lowerText = text.toLowerCase();
  const detectedIndicators: CrisisIndicator[] = [];

  for (const indicator of crisisIndicators) {
    const hasKeyword = indicator.keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      detectedIndicators.push(indicator);
    }
  }

  if (detectedIndicators.length === 0) {
    return {
      detected: false,
      indicators: [],
      highestSeverity: null,
      recommendedActions: []
    };
  }

  // Find highest severity
  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
  const highestSeverity = detectedIndicators.reduce((highest, current) =>
    severityOrder[current.severity] > severityOrder[highest] ? current.severity : highest
  , 'low' as 'low' | 'medium' | 'high' | 'critical');

  // Collect all recommended actions
  const recommendedActions = detectedIndicators.flatMap(indicator => [
    indicator.response.immediate_action,
    ...indicator.response.follow_up
  ]);

  return {
    detected: true,
    indicators: detectedIndicators,
    highestSeverity,
    recommendedActions: [...new Set(recommendedActions)] // Remove duplicates
  };
}

export async function handleCrisisDetection(
  userId: string,
  conversationId: string,
  message: string,
  crisisResult: ReturnType<typeof detectCrisis>
): Promise<void> {
  // Create crisis event in database
  await (prisma as any).crisisEvent.create({
    data: {
      userId,
      source: 'CONVERSATION',
      detectedAt: new Date(),
      flagLevel: crisisResult.highestSeverity?.toUpperCase() as any,
      escalationStatus: 'PENDING',
      notes: JSON.stringify({
        message: message.substring(0, 500), // Truncate for storage
        indicators: crisisResult.indicators.map(i => ({
          category: i.category,
          severity: i.severity,
          keywords: i.keywords
        })),
        recommendedActions: crisisResult.recommendedActions
      })
    }
  });

  // Update conversation crisis flag
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { crisisDetected: true }
  });

  // TODO: Implement escalation protocols based on severity
  // - Send notifications to crisis team
  // - Contact emergency services for critical cases
  // - Block certain content types
  // - Schedule follow-up interventions

  console.log(`Crisis detected for user ${userId}:`, {
    severity: crisisResult.highestSeverity,
    indicators: crisisResult.indicators.length,
    conversationId
  });
}

export function getCrisisResources(location?: string): {
  hotlines: Array<{ name: string; number: string; description: string }>;
  websites: Array<{ name: string; url: string; description: string }>;
} {
  // Default international resources
  const resources = {
    hotlines: [
      {
        name: 'International Association for Suicide Prevention',
        number: 'Find local hotline at befrienders.org',
        description: 'Global network of suicide prevention hotlines'
      },
      {
        name: 'Crisis Text Line',
        number: 'Text HOME to 741741 (US)',
        description: '24/7 crisis support via text message'
      }
    ],
    websites: [
      {
        name: 'Mental Health America',
        url: 'https://www.mhanational.org',
        description: 'Mental health screening and resources'
      },
      {
        name: 'National Alliance on Mental Illness',
        url: 'https://www.nami.org',
        description: 'Mental health education and support'
      },
      {
        name: 'Psychology Today',
        url: 'https://www.psychologytoday.com',
        description: 'Find mental health professionals'
      }
    ]
  };

  // Add location-specific resources if available
  if (location?.toLowerCase().includes('us') || location?.toLowerCase().includes('united states')) {
    resources.hotlines.unshift({
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      description: '24/7 suicide prevention and crisis support'
    });
  }

  return resources;
}

export function generateCrisisResponse(
  crisisResult: ReturnType<typeof detectCrisis>,
  userLocation?: string
): string {
  const resources = getCrisisResources(userLocation);

  let response = "I'm really concerned about what you've shared. ";

  if (crisisResult.highestSeverity === 'critical') {
    response += "This sounds like an emergency situation. Please call emergency services (911 in the US) immediately, or go to your nearest emergency room. ";
  } else if (crisisResult.highestSeverity === 'high') {
    response += "This is a serious situation that needs immediate attention. ";
  } else {
    response += "I want to make sure you're safe and supported. ";
  }

  response += "Here are some resources that can help:\n\n";

  // Add hotlines
  response += "**Crisis Hotlines:**\n";
  resources.hotlines.forEach(hotline => {
    response += `• ${hotline.name}: ${hotline.number}\n  ${hotline.description}\n`;
  });

  response += "\n**Helpful Websites:**\n";
  resources.websites.forEach(site => {
    response += `• ${site.name}: ${site.url}\n  ${site.description}\n`;
  });

  response += "\nYou're not alone in this. Please reach out to these resources or a trusted person in your life. If you're in immediate danger, call emergency services right away.";

  if (crisisResult.highestSeverity !== 'critical') {
    response += "\n\nI'm here to listen and support you, but I'm not a substitute for professional help. Would you like me to help you find additional resources or coping strategies?";
  }

  return response;
}