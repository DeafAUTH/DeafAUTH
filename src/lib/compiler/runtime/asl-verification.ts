/**
 * DeafAUTH ASL Verification Runtime
 * Handles American Sign Language verification for authentication
 */

export interface ASLVerificationSession {
  id: string;
  userId?: string;
  status: ASLSessionStatus;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verificationResults: ASLVerificationResult[];
}

export type ASLSessionStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'expired';

export interface ASLVerificationResult {
  timestamp: Date;
  signDetected: string;
  expectedSign: string;
  confidence: number;
  passed: boolean;
}

export interface ASLVerificationConfig {
  timeoutMs: number;
  extendedTimeoutMs: number;
  confidenceThreshold: number;
  maxAttempts: number;
  fallbackEnabled: boolean;
  fallbackMethod: 'video_call' | 'email' | 'manual_review';
}

const DEFAULT_ASL_CONFIG: ASLVerificationConfig = {
  timeoutMs: 300000, // 5 minutes - extended for ASL
  extendedTimeoutMs: 600000, // 10 minutes
  confidenceThreshold: 0.75,
  maxAttempts: 3,
  fallbackEnabled: true,
  fallbackMethod: 'video_call',
};

/**
 * Create a new ASL verification session
 */
export function createASLSession(
  userId?: string,
  config: Partial<ASLVerificationConfig> = {}
): ASLVerificationSession {
  const mergedConfig = { ...DEFAULT_ASL_CONFIG, ...config };
  const now = new Date();

  return {
    id: `asl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    status: 'pending',
    createdAt: now,
    expiresAt: new Date(now.getTime() + mergedConfig.timeoutMs),
    attempts: 0,
    maxAttempts: mergedConfig.maxAttempts,
    verificationResults: [],
  };
}

/**
 * Start ASL verification process
 */
export function startASLVerification(
  session: ASLVerificationSession
): ASLVerificationSession {
  return {
    ...session,
    status: 'in_progress',
  };
}

/**
 * Process ASL sign detection result
 */
export function processASLSign(
  session: ASLVerificationSession,
  signDetected: string,
  expectedSign: string,
  confidence: number,
  config: Partial<ASLVerificationConfig> = {}
): ASLVerificationSession {
  const mergedConfig = { ...DEFAULT_ASL_CONFIG, ...config };
  const passed = confidence >= mergedConfig.confidenceThreshold && 
                 signDetected.toLowerCase() === expectedSign.toLowerCase();

  const result: ASLVerificationResult = {
    timestamp: new Date(),
    signDetected,
    expectedSign,
    confidence,
    passed,
  };

  const updatedSession: ASLVerificationSession = {
    ...session,
    attempts: session.attempts + 1,
    verificationResults: [...session.verificationResults, result],
  };

  // Check if verification is complete
  if (passed) {
    return {
      ...updatedSession,
      status: 'completed',
    };
  }

  // Check if max attempts reached
  if (updatedSession.attempts >= updatedSession.maxAttempts) {
    return {
      ...updatedSession,
      status: 'failed',
    };
  }

  return updatedSession;
}

/**
 * Extend ASL session timeout
 */
export function extendASLSession(
  session: ASLVerificationSession,
  additionalMs: number
): ASLVerificationSession {
  return {
    ...session,
    expiresAt: new Date(session.expiresAt.getTime() + additionalMs),
  };
}

/**
 * Check if session is expired
 */
export function isASLSessionExpired(session: ASLVerificationSession): boolean {
  return new Date() > session.expiresAt;
}

/**
 * Get verification summary
 */
export interface ASLVerificationSummary {
  sessionId: string;
  status: ASLSessionStatus;
  totalAttempts: number;
  successfulAttempts: number;
  averageConfidence: number;
  timeSpentMs: number;
  fallbackRecommended: boolean;
}

export function getASLVerificationSummary(
  session: ASLVerificationSession,
  config: Partial<ASLVerificationConfig> = {}
): ASLVerificationSummary {
  const mergedConfig = { ...DEFAULT_ASL_CONFIG, ...config };
  const successfulAttempts = session.verificationResults.filter(r => r.passed).length;
  const totalConfidence = session.verificationResults.reduce((sum, r) => sum + r.confidence, 0);
  const averageConfidence = session.verificationResults.length > 0 
    ? totalConfidence / session.verificationResults.length 
    : 0;

  const timeSpentMs = session.verificationResults.length > 0
    ? session.verificationResults[session.verificationResults.length - 1].timestamp.getTime() - 
      session.createdAt.getTime()
    : 0;

  // Recommend fallback if confidence is consistently low
  const fallbackRecommended = 
    session.status === 'failed' ||
    (session.attempts >= 2 && averageConfidence < mergedConfig.confidenceThreshold * 0.8);

  return {
    sessionId: session.id,
    status: session.status,
    totalAttempts: session.attempts,
    successfulAttempts,
    averageConfidence,
    timeSpentMs,
    fallbackRecommended,
  };
}

/**
 * ASL sign dictionary for common verification signs
 */
export const ASL_VERIFICATION_SIGNS = [
  { name: 'yes', description: 'Closed fist moving up and down' },
  { name: 'no', description: 'Index and middle finger tapping thumb' },
  { name: 'hello', description: 'Open hand near forehead moving outward' },
  { name: 'thank_you', description: 'Flat hand from chin moving forward' },
  { name: 'please', description: 'Flat hand circling on chest' },
  { name: 'help', description: 'Closed fist on open palm, both moving up' },
  { name: 'okay', description: 'Thumb and index finger forming circle' },
  { name: 'understand', description: 'Index finger near forehead flicking up' },
] as const;

export type ASLVerificationSign = typeof ASL_VERIFICATION_SIGNS[number]['name'];

/**
 * Generate random verification sign request
 */
export function generateASLChallenge(): { sign: ASLVerificationSign; description: string } {
  const index = Math.floor(Math.random() * ASL_VERIFICATION_SIGNS.length);
  const sign = ASL_VERIFICATION_SIGNS[index];
  return {
    sign: sign.name,
    description: sign.description,
  };
}

/**
 * Visual feedback for ASL verification
 */
export interface ASLVisualFeedback {
  type: 'detecting' | 'recognized' | 'retry' | 'success' | 'fallback_available';
  message: string;
  signIcon?: string;
  progress?: number;
  color: string;
}

export function createASLFeedback(
  session: ASLVerificationSession,
  currentResult?: ASLVerificationResult
): ASLVisualFeedback {
  if (session.status === 'completed') {
    return {
      type: 'success',
      message: 'ASL verification successful',
      color: '#22C55E',
      progress: 100,
    };
  }

  if (session.status === 'failed') {
    return {
      type: 'fallback_available',
      message: 'ASL verification unavailable. Alternative verification available.',
      color: '#F59E0B',
    };
  }

  if (currentResult && !currentResult.passed) {
    return {
      type: 'retry',
      message: `Sign not recognized (${Math.round(currentResult.confidence * 100)}% confidence). Please try again.`,
      color: '#EF4444',
      progress: (session.attempts / session.maxAttempts) * 100,
    };
  }

  if (currentResult && currentResult.passed) {
    return {
      type: 'recognized',
      message: `Sign recognized: ${currentResult.signDetected}`,
      signIcon: currentResult.signDetected,
      color: '#22C55E',
      progress: 100,
    };
  }

  return {
    type: 'detecting',
    message: 'Position your hands in view of the camera',
    color: '#3B82F6',
    progress: 0,
  };
}
