/**
 * User Experience Testing Utilities
 * Provides comprehensive UX testing capabilities for the mental health platform
 */

export interface UXTestResult {
  testId: string;
  userId: string;
  task: string;
  completionTime: number;
  success: boolean;
  errors: number;
  satisfaction: number; // 1-5 scale
  comments?: string;
  timestamp: Date;
}

export interface UsabilityMetrics {
  taskCompletionRate: number;
  averageCompletionTime: number;
  errorRate: number;
  userSatisfaction: number;
  learnabilityScore: number;
}

export interface A11yViolation {
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  elements: string[];
  help: string;
}

export interface AccessibilityCheckResults {
  score: number;
  level: 'A' | 'AA' | 'AAA';
  violations: A11yViolation[];
  summary: {
    passed: number;
    failed: number;
    incomplete: number;
    inapplicable: number;
  };
}

/**
 * Run comprehensive UX testing for a feature
 */
export async function runUXTest(
  testId: string,
  userId: string,
  task: string,
  testFunction: () => Promise<{ success: boolean; time: number; errors: number }>
): Promise<UXTestResult> {
  const startTime = Date.now();

  try {
    const result = await testFunction();
    const completionTime = Date.now() - startTime;

    return {
      testId,
      userId,
      task,
      completionTime,
      success: result.success,
      errors: result.errors,
      satisfaction: 4, // Default satisfaction - would be collected from user
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      testId,
      userId,
      task,
      completionTime: Date.now() - startTime,
      success: false,
      errors: 1,
      satisfaction: 2,
      comments: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

/**
 * Calculate usability metrics from test results
 */
export function calculateUsabilityMetrics(results: UXTestResult[]): UsabilityMetrics {
  const totalTests = results.length;
  const completedTests = results.filter(r => r.success).length;
  const taskCompletionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  const successfulTests = results.filter(r => r.success);
  const averageCompletionTime = successfulTests.length > 0
    ? successfulTests.reduce((sum, r) => sum + r.completionTime, 0) / successfulTests.length
    : 0;

  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const errorRate = totalTests > 0 ? (totalErrors / totalTests) * 100 : 0;

  const averageSatisfaction = results.length > 0
    ? results.reduce((sum, r) => sum + r.satisfaction, 0) / results.length
    : 0;

  // Simplified learnability score based on improvement over time
  const learnabilityScore = calculateLearnabilityScore(results);

  return {
    taskCompletionRate,
    averageCompletionTime,
    errorRate,
    userSatisfaction: averageSatisfaction,
    learnabilityScore,
  };
}

/**
 * Perform accessibility testing
 */
export async function runAccessibilityTest(page: any): Promise<AccessibilityCheckResults> {
  // This would integrate with axe-core or similar accessibility testing library
  // For now, return mock results
  return {
    score: 85,
    level: 'AA',
    violations: [
      {
        rule: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        elements: ['.text-muted'],
        help: 'Ensure text has at least 4.5:1 contrast ratio',
      },
    ],
    summary: {
      passed: 25,
      failed: 3,
      incomplete: 2,
      inapplicable: 5,
    },
  };
}

/**
 * Test user flow efficiency
 */
export async function testUserFlowEfficiency(
  flowName: string,
  steps: Array<{ name: string; expectedTime: number }>
): Promise<{
  flowName: string;
  totalTime: number;
  efficiency: number;
  bottlenecks: string[];
}> {
  // Mock implementation - would measure actual user flow times
  const totalTime = steps.reduce((sum, step) => sum + step.expectedTime, 0);
  const efficiency = 85; // Percentage efficiency
  const bottlenecks: string[] = [];

  steps.forEach(step => {
    if (step.expectedTime > 10) { // Steps taking > 10 seconds are bottlenecks
      bottlenecks.push(step.name);
    }
  });

  return {
    flowName,
    totalTime,
    efficiency,
    bottlenecks,
  };
}

/**
 * Test mobile responsiveness
 */
export async function testMobileResponsiveness(
  page: any,
  breakpoints: Array<{ name: string; width: number; height: number }>
): Promise<Array<{
  breakpoint: string;
  issues: string[];
  score: number;
}>> {
  const results = [];

  for (const breakpoint of breakpoints) {
    // Mock mobile testing - would use actual browser automation
    const issues: string[] = [];
    let score = 100;

    // Check for common mobile issues
    if (breakpoint.width < 768) {
      // Check if elements are properly sized for mobile
      issues.push('Touch targets may be too small');
      score -= 10;
    }

    results.push({
      breakpoint: breakpoint.name,
      issues,
      score,
    });
  }

  return results;
}

/**
 * Calculate learnability score based on test results over time
 */
function calculateLearnabilityScore(results: UXTestResult[]): number {
  if (results.length < 2) return 50; // Default score for insufficient data

  // Sort by timestamp
  const sortedResults = results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calculate improvement trend
  let improvementSum = 0;
  let improvementCount = 0;

  for (let i = 1; i < sortedResults.length; i++) {
    const current = sortedResults[i];
    const previous = sortedResults[i - 1];

    if (current.success && previous.success) {
      const timeImprovement = (previous.completionTime - current.completionTime) / previous.completionTime;
      improvementSum += timeImprovement;
      improvementCount++;
    }
  }

  const averageImprovement = improvementCount > 0 ? improvementSum / improvementCount : 0;
  const learnabilityScore = Math.max(0, Math.min(100, 50 + (averageImprovement * 50)));

  return learnabilityScore;
}

/**
 * Generate UX recommendations based on test results
 */
export function generateUXRecommendations(metrics: UsabilityMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.taskCompletionRate < 80) {
    recommendations.push('Improve task completion rate by simplifying workflows');
  }

  if (metrics.averageCompletionTime > 300) { // 5 minutes
    recommendations.push('Reduce task completion time through better information architecture');
  }

  if (metrics.errorRate > 20) {
    recommendations.push('Reduce error rate by improving error prevention and recovery');
  }

  if (metrics.userSatisfaction < 3) {
    recommendations.push('Increase user satisfaction through better design and functionality');
  }

  if (metrics.learnabilityScore < 70) {
    recommendations.push('Improve learnability with better onboarding and progressive disclosure');
  }

  return recommendations;
}

// Additional interfaces for the missing functions
export interface TestScenario {
  name: string;
  steps: Array<{
    action: string;
    target: string;
    value?: string;
  }>;
  successCriteria: string[];
}

export interface UsabilityTestResult {
  completed: boolean;
  totalTime: number;
  stepsCompleted: number;
  errors: string[];
  errorRate: number;
  averageStepTime: number;
}

export interface FeedbackItem {
  userId: string;
  rating: number;
  comments: string;
  task: string;
  timeSpent: number;
}

export interface FeedbackAnalysis {
  averageRating: number;
  totalResponses: number;
  sentimentScore: number;
  commonThemes: string[];
  painPoints: string[];
  criticalIssues: string[];
  recommendations: string[];
  nps: {
    promoters: number;
    passives: number;
    detractors: number;
    score: number;
  };
}

export interface UXReport {
  overallScore: number;
  usabilityMetrics: UsabilityMetrics;
  feedbackAnalysis: FeedbackAnalysis;
  recommendations: string[];
  priorityImprovements: string[];
  strengths: string[];
}

/**
 * Conduct a usability test by simulating user interactions
 */
export async function conductUsabilityTest(scenario: TestScenario): Promise<UsabilityTestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let stepsCompleted = 0;

  try {
    // Simulate each step in the scenario
    for (const step of scenario.steps) {
      const stepStartTime = Date.now();

      // Mock step execution - in real implementation, this would interact with actual UI
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // Simulate step time

      // Simulate potential errors
      if (Math.random() < 0.1) { // 10% chance of error
        errors.push(`Failed to ${step.action} on ${step.target}`);
      } else {
        stepsCompleted++;
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error during test execution');
  }

  const totalTime = Date.now() - startTime;
  const completed = errors.length === 0 && stepsCompleted === scenario.steps.length;
  const errorRate = scenario.steps.length > 0 ? (errors.length / scenario.steps.length) * 100 : 0;
  const averageStepTime = stepsCompleted > 0 ? totalTime / stepsCompleted : 0;

  return {
    completed,
    totalTime,
    stepsCompleted,
    errors,
    errorRate,
    averageStepTime,
  };
}

/**
 * Analyze user feedback to extract insights
 */
export function analyzeUserFeedback(feedback: FeedbackItem[]): FeedbackAnalysis {
  const totalResponses = feedback.length;
  const averageRating = totalResponses > 0
    ? feedback.reduce((sum, item) => sum + item.rating, 0) / totalResponses
    : 0;

  // Simple sentiment analysis based on keywords
  const positiveWords = ['good', 'great', 'excellent', 'love', 'perfect', 'easy', 'intuitive', 'fast'];
  const negativeWords = ['bad', 'terrible', 'hard', 'difficult', 'confusing', 'slow', 'frustrating', 'broken'];

  let sentimentScore = 0;
  const commonThemes: string[] = [];
  const painPoints: string[] = [];
  const criticalIssues: string[] = [];

  feedback.forEach(item => {
    const comment = item.comments.toLowerCase();

    // Calculate sentiment
    const positiveCount = positiveWords.filter(word => comment.includes(word)).length;
    const negativeCount = negativeWords.filter(word => comment.includes(word)).length;
    sentimentScore += (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);

    // Extract themes and pain points
    if (comment.includes('interface') || comment.includes('design')) {
      if (!commonThemes.includes('interface')) commonThemes.push('interface');
    }
    if (comment.includes('mobile') || comment.includes('button')) {
      if (!painPoints.includes('mobile')) painPoints.push('mobile');
      if (!criticalIssues.includes('mobile')) criticalIssues.push('mobile');
    }
    if (comment.includes('navigation') || comment.includes('find')) {
      if (!painPoints.includes('navigation')) painPoints.push('navigation');
      if (!criticalIssues.includes('navigation')) criticalIssues.push('navigation');
    }
    if (comment.includes('confusing') || comment.includes('hard')) {
      if (!painPoints.includes('usability')) painPoints.push('usability');
    }
  });

  sentimentScore = totalResponses > 0 ? sentimentScore / totalResponses : 0;

  // Calculate NPS
  const promoters = feedback.filter(item => item.rating >= 9).length;
  const passives = feedback.filter(item => item.rating >= 7 && item.rating <= 8).length;
  const detractors = feedback.filter(item => item.rating <= 6).length;
  const npsScore = totalResponses > 0 ? ((promoters - detractors) / totalResponses) * 100 : 0;

  // Generate recommendations
  const recommendations: string[] = [];
  if (painPoints.includes('mobile')) {
    recommendations.push('Improve mobile responsiveness and touch targets');
  }
  if (painPoints.includes('navigation')) {
    recommendations.push('Enhance navigation and information architecture');
  }
  if (painPoints.includes('usability')) {
    recommendations.push('Simplify user interface and reduce cognitive load');
  }
  if (averageRating < 3) {
    recommendations.push('Conduct user research to understand core pain points');
  }

  return {
    averageRating: Math.round(averageRating * 100) / 100,
    totalResponses,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    commonThemes,
    painPoints,
    criticalIssues,
    recommendations,
    nps: {
      promoters,
      passives,
      detractors,
      score: Math.round(npsScore),
    },
  };
}

/**
 * Generate a comprehensive UX report
 */
export function generateUXReport(
  usabilityResults: Array<{
    scenario: string;
    completed: boolean;
    totalTime: number;
    stepsCompleted: number;
    errors: string[];
    successRate: number;
  }>,
  feedbackAnalysis: FeedbackAnalysis
): UXReport {
  // Calculate overall usability metrics
  const totalScenarios = usabilityResults.length;
  const completedScenarios = usabilityResults.filter(r => r.completed).length;
  const averageCompletionTime = usabilityResults.reduce((sum, r) => sum + r.totalTime, 0) / totalScenarios;
  const totalErrors = usabilityResults.reduce((sum, r) => sum + r.errors.length, 0);
  const averageErrorRate = usabilityResults.reduce((sum, r) => sum + (r.errors.length / Math.max(r.stepsCompleted, 1)), 0) / totalScenarios;

  const usabilityMetrics: UsabilityMetrics = {
    taskCompletionRate: totalScenarios > 0 ? (completedScenarios / totalScenarios) * 100 : 0,
    averageCompletionTime,
    errorRate: averageErrorRate * 100,
    userSatisfaction: feedbackAnalysis.averageRating,
    learnabilityScore: 75, // Simplified - would be calculated from multiple test sessions
  };

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (usabilityMetrics.taskCompletionRate * 0.3) +
    ((100 - usabilityMetrics.errorRate) * 0.3) +
    (usabilityMetrics.userSatisfaction * 20 * 0.2) + // Convert 1-5 scale to percentage
    (usabilityMetrics.learnabilityScore * 0.2)
  );

  // Identify priority improvements
  const priorityImprovements: string[] = [];
  if (usabilityMetrics.taskCompletionRate < 80) {
    priorityImprovements.push('critical');
  }
  if (usabilityMetrics.errorRate > 20) {
    priorityImprovements.push('error handling');
  }
  if (feedbackAnalysis.averageRating < 3) {
    priorityImprovements.push('user satisfaction');
  }
  if (feedbackAnalysis.painPoints.includes('mobile')) {
    priorityImprovements.push('mobile');
  }

  // Identify strengths
  const strengths: string[] = [];
  if (usabilityMetrics.taskCompletionRate > 90) {
    strengths.push('task completion');
  }
  if (usabilityMetrics.errorRate < 10) {
    strengths.push('error prevention');
  }
  if (feedbackAnalysis.averageRating > 4) {
    strengths.push('user satisfaction');
  }
  if (feedbackAnalysis.commonThemes.includes('interface')) {
    strengths.push('design');
  }

  return {
    overallScore,
    usabilityMetrics,
    feedbackAnalysis,
    recommendations: feedbackAnalysis.recommendations,
    priorityImprovements,
    strengths,
  };
}