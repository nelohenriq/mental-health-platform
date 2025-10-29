export interface CrisisIndicator {
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  response: {
    immediate_action: string;
    follow_up: string[];
  };
}

export interface CrisisAssessmentContext {
  message: string;
  userHistory: Array<{
    message: string;
    level: string;
    timestamp: Date;
  }>;
  currentMood: number;
  recentMoods: number[];
}

export interface CrisisAssessmentResult {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  requiresImmediate: boolean;
  pattern?: string[];
  triggers?: string[];
}

export interface CrisisResponseData {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  triggers: string[];
  context: string;
}

export interface CrisisResponse {
  immediateAction: boolean;
  contactEmergency: boolean;
  message: string;
  resources: string[];
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
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  confidence: number;
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

  // Map to uppercase levels as expected by tests
  const levelMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW'
  };

  const level = adjustedSeverity ? levelMap[adjustedSeverity] : null;
  const confidence = riskScore / 100; // Normalize to 0-1

  if (detectedIndicators.length === 0 && riskScore < 30) {
    return {
      detected: false,
      indicators: [],
      level: null,
      confidence: confidence,
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
    level: level,
    confidence: confidence,
    overallThreshold,
    riskScore,
    recommendedActions: [...new Set(recommendedActions)]
  };
}

export function assessCrisisLevel(context: CrisisAssessmentContext): CrisisAssessmentResult {
  const { message, userHistory, currentMood, recentMoods } = context;

  // Use detectCrisis for initial assessment
  const detection = detectCrisis(message, {
    userHistory: userHistory.map(h => h.message),
    moodLevel: currentMood,
    previousCrisisEvents: userHistory.filter(h => h.level === 'CRITICAL' || h.level === 'HIGH').length
  });

  // Determine level based on detection and context
  let level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (detection.level === 'CRITICAL') {
    level = 'CRITICAL';
  } else if (detection.level === 'HIGH' || userHistory.some(h => h.level === 'CRITICAL')) {
    level = 'HIGH';
  } else if (detection.level === 'MEDIUM' || recentMoods.filter(m => m <= 2).length >= 3) {
    level = 'MEDIUM';
  }

  const requiresImmediate = level === 'CRITICAL';

  // Identify patterns and triggers
  const pattern: string[] = [];
  const triggers: string[] = [];

  if (userHistory.some(h => h.level === 'CRITICAL' || h.level === 'HIGH')) {
    pattern.push('recurring');
  }

  if (recentMoods.filter(m => m <= 2).length >= 3) {
    triggers.push('mood_trend');
  }

  // Add triggers from detected indicators
  detection.indicators.forEach(indicator => {
    triggers.push(...indicator.keywords.filter(k => message.toLowerCase().includes(k)));
  });

  return {
    level,
    requiresImmediate,
    pattern: pattern.length > 0 ? pattern : undefined,
    triggers: triggers.length > 0 ? [...new Set(triggers)] : undefined
  };
}

export function generateCrisisResponse(data: CrisisResponseData): CrisisResponse {
  const { level, triggers, context } = data;

  const baseResources = ['988 Suicide & Crisis Lifeline'];
  let message = '';
  let immediateAction = false;
  let contactEmergency = false;

  switch (level) {
    case 'CRITICAL':
      immediateAction = true;
      contactEmergency = true;
      message = 'This appears to be a critical emergency situation. Please call emergency services immediately or go to the nearest emergency room.';
      baseResources.push('911 Emergency Services');
      break;
    case 'HIGH':
      message = 'I\'m concerned about your safety and well-being. Please reach out to a crisis hotline or mental health professional immediately.';
      baseResources.push('National Alliance on Mental Illness (NAMI) Helpline');
      break;
    case 'MEDIUM':
      message = 'You seem to be going through a difficult time. Consider talking to a trusted friend, family member, or mental health professional.';
      baseResources.push('Local mental health services');
      break;
    case 'LOW':
      message = 'If you\'re feeling distressed, remember that help is available when you need it.';
      break;
  }

  return {
    immediateAction,
    contactEmergency,
    message,
    resources: baseResources
  };
}

// Enhanced crisis detection pipeline with multi-stage analysis
export interface CrisisDetectionPipeline {
  stage1: (text: string) => Promise<CrisisDetectionResult>;
  stage2: (text: string, context: CrisisContext) => Promise<CrisisDetectionResult>;
  stage3: (text: string, context: CrisisContext, history: CrisisHistory) => Promise<CrisisDetectionResult>;
  finalAssessment: (results: CrisisDetectionResult[]) => Promise<CrisisAssessment>;
}

export interface CrisisDetectionResult {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  confidence: number;
  indicators: string[];
  riskFactors: string[];
  recommendedActions: string[];
}

export interface CrisisContext {
  userId: string;
  currentMood?: number;
  recentMoods?: number[];
  conversationHistory?: string[];
  previousCrisisEvents?: number;
  timeOfDay?: string;
  location?: string;
}

export interface CrisisHistory {
  previousIncidents: Array<{
    timestamp: Date;
    level: string;
    resolution: string;
  }>;
  patterns: string[];
  riskFactors: string[];
}

export interface CrisisAssessment {
  overallLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  confidence: number;
  requiresImmediateAction: boolean;
  escalationPath: string[];
  interventionStrategy: string;
  monitoringRequired: boolean;
}

// Stage 1: Basic keyword and pattern matching
export async function stage1KeywordDetection(text: string): Promise<CrisisDetectionResult> {
  const result = detectCrisis(text);

  return {
    level: result.level || 'NONE',
    confidence: result.confidence,
    indicators: result.indicators.map(i => i.keywords).flat(),
    riskFactors: [],
    recommendedActions: result.recommendedActions
  };
}

// Stage 2: Context-aware analysis
export async function stage2ContextAnalysis(text: string, context: CrisisContext): Promise<CrisisDetectionResult> {
  const baseResult = await stage1KeywordDetection(text);

  // Enhance with context
  let adjustedLevel = baseResult.level;
  let additionalConfidence = 0;
  const riskFactors: string[] = [];
  const additionalActions: string[] = [];

  // Mood-based risk assessment
  if (context.currentMood !== undefined) {
    if (context.currentMood <= 2) {
      riskFactors.push('extremely_low_mood');
      additionalConfidence += 0.2;
      if (adjustedLevel === 'NONE') adjustedLevel = 'LOW';
    } else if (context.currentMood <= 4) {
      riskFactors.push('low_mood');
      additionalConfidence += 0.1;
    }
  }

  // Mood trend analysis
  if (context.recentMoods && context.recentMoods.length >= 3) {
    const recentAverage = context.recentMoods.slice(-7).reduce((a, b) => a + b, 0) / Math.min(context.recentMoods.length, 7);
    const currentTrend = context.recentMoods.slice(-3).every(mood => mood <= 3);

    if (currentTrend && recentAverage <= 3) {
      riskFactors.push('sustained_low_mood_trend');
      additionalConfidence += 0.15;
      if (['NONE', 'LOW'].includes(adjustedLevel)) adjustedLevel = 'MEDIUM';
    }
  }

  // Conversation history analysis
  if (context.conversationHistory) {
    const negativePatterns = context.conversationHistory.filter(msg =>
      msg.toLowerCase().includes('depressed') ||
      msg.toLowerCase().includes('hopeless') ||
      msg.toLowerCase().includes('suicidal') ||
      msg.toLowerCase().includes('harm')
    ).length;

    if (negativePatterns >= 3) {
      riskFactors.push('recurring_negative_themes');
      additionalConfidence += 0.1;
    }
  }

  // Previous crisis history
  if (context.previousCrisisEvents && context.previousCrisisEvents > 0) {
    riskFactors.push('previous_crisis_history');
    additionalConfidence += context.previousCrisisEvents * 0.05;
  }

  // Time-based risk factors
  if (context.timeOfDay) {
    const hour = parseInt(context.timeOfDay.split(':')[0]);
    if (hour >= 2 && hour <= 5) {
      riskFactors.push('late_night_crisis');
      additionalConfidence += 0.05;
    }
  }

  return {
    level: adjustedLevel,
    confidence: Math.min(baseResult.confidence + additionalConfidence, 1.0),
    indicators: baseResult.indicators,
    riskFactors,
    recommendedActions: [...baseResult.recommendedActions, ...additionalActions]
  };
}

// Stage 3: Historical pattern analysis
export async function stage3HistoricalAnalysis(
  text: string,
  context: CrisisContext,
  history: CrisisHistory
): Promise<CrisisDetectionResult> {
  const contextResult = await stage2ContextAnalysis(text, context);

  let adjustedLevel = contextResult.level;
  let additionalConfidence = 0;
  const historicalRiskFactors: string[] = [];

  // Analyze patterns in crisis history
  if (history.previousIncidents.length > 0) {
    const recentIncidents = history.previousIncidents.filter(
      incident => Date.now() - incident.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    if (recentIncidents.length >= 2) {
      historicalRiskFactors.push('frequent_recent_crises');
      additionalConfidence += 0.2;
      if (['NONE', 'LOW', 'MEDIUM'].includes(adjustedLevel)) adjustedLevel = 'HIGH';
    }

    // Escalating pattern
    const escalating = recentIncidents.every((incident, index) =>
      index === 0 || ['CRITICAL', 'HIGH'].includes(incident.level)
    );

    if (escalating) {
      historicalRiskFactors.push('escalating_crisis_pattern');
      additionalConfidence += 0.15;
      if (adjustedLevel !== 'CRITICAL') adjustedLevel = 'HIGH';
    }
  }

  // Pattern recognition
  if (history.patterns.includes('recurring')) {
    historicalRiskFactors.push('recurring_crisis_pattern');
    additionalConfidence += 0.1;
  }

  return {
    level: adjustedLevel,
    confidence: Math.min(contextResult.confidence + additionalConfidence, 1.0),
    indicators: contextResult.indicators,
    riskFactors: [...contextResult.riskFactors, ...historicalRiskFactors],
    recommendedActions: contextResult.recommendedActions
  };
}

// Final assessment synthesis
export async function finalCrisisAssessment(results: CrisisDetectionResult[]): Promise<CrisisAssessment> {
  if (results.length === 0) {
    return {
      overallLevel: 'NONE',
      confidence: 0,
      requiresImmediateAction: false,
      escalationPath: [],
      interventionStrategy: 'monitor',
      monitoringRequired: false
    };
  }

  // Aggregate results
  const levels = results.map(r => r.level);
  const confidences = results.map(r => r.confidence);
  const allRiskFactors = results.flatMap(r => r.riskFactors);
  const allActions = results.flatMap(r => r.recommendedActions);

  // Determine overall level based on highest severity
  const levelPriority = { 'CRITICAL': 5, 'HIGH': 4, 'MEDIUM': 3, 'LOW': 2, 'NONE': 1 };
  const overallLevel = levels.reduce((highest, current) =>
    levelPriority[current] > levelPriority[highest] ? current : highest
  );

  // Calculate average confidence
  const averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // Determine intervention strategy
  const requiresImmediateAction = overallLevel === 'CRITICAL';
  const escalationPath = overallLevel === 'CRITICAL' ? ['emergency_services', 'crisis_team', 'family_notification'] :
                        overallLevel === 'HIGH' ? ['crisis_hotline', 'therapist', 'emergency_contacts'] :
                        overallLevel === 'MEDIUM' ? ['therapist', 'support_groups', 'self_help'] :
                        [];

  const interventionStrategy = overallLevel === 'CRITICAL' ? 'immediate_intervention' :
                              overallLevel === 'HIGH' ? 'urgent_support' :
                              overallLevel === 'MEDIUM' ? 'therapeutic_support' :
                              'preventive_monitoring';

  const monitoringRequired = ['CRITICAL', 'HIGH', 'MEDIUM'].includes(overallLevel);

  return {
    overallLevel,
    confidence: averageConfidence,
    requiresImmediateAction,
    escalationPath,
    interventionStrategy,
    monitoringRequired
  };
}

// Complete crisis detection pipeline
export const crisisDetectionPipeline: CrisisDetectionPipeline = {
  stage1: stage1KeywordDetection,
  stage2: stage2ContextAnalysis,
  stage3: stage3HistoricalAnalysis,
  finalAssessment: finalCrisisAssessment
};

// Pipeline execution function
export async function executeCrisisDetectionPipeline(
  text: string,
  context: CrisisContext,
  history: CrisisHistory
): Promise<CrisisAssessment> {
  // Execute all stages
  const stage1Result = await crisisDetectionPipeline.stage1(text);
  const stage2Result = await crisisDetectionPipeline.stage2(text, context);
  const stage3Result = await crisisDetectionPipeline.stage3(text, context, history);

  // Final assessment
  const finalResult = await crisisDetectionPipeline.finalAssessment([
    stage1Result,
    stage2Result,
    stage3Result
  ]);

  return finalResult;
}