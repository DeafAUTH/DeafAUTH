/**
 * DeafAUTH Visual Challenge Runtime
 * Handles visual authentication challenges without audio dependencies
 */

export interface VisualChallenge {
  id: string;
  type: VisualChallengeType;
  data: unknown;
  createdAt: Date;
  expiresAt: Date;
  extendedUntil?: Date;
}

export type VisualChallengeType = 
  | 'pattern' 
  | 'image_select' 
  | 'gesture' 
  | 'color_sequence'
  | 'shape_match';

export interface VisualChallengeResult {
  verified: boolean;
  challengeId: string;
  completedAt: Date;
  attempts: number;
}

export interface VisualChallengeConfig {
  defaultTimeoutMs: number;
  extendedTimeoutMs: number;
  maxAttempts: number;
  visualFeedback: boolean;
}

const DEFAULT_CONFIG: VisualChallengeConfig = {
  defaultTimeoutMs: 60000,
  extendedTimeoutMs: 300000,
  maxAttempts: 3,
  visualFeedback: true,
};

/**
 * Generate a visual challenge
 */
export function generateVisualChallenge(
  type: VisualChallengeType,
  config: Partial<VisualChallengeConfig> = {}
): VisualChallenge {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const now = new Date();
  
  return {
    id: `vc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    data: generateChallengeData(type),
    createdAt: now,
    expiresAt: new Date(now.getTime() + mergedConfig.defaultTimeoutMs),
    extendedUntil: new Date(now.getTime() + mergedConfig.extendedTimeoutMs),
  };
}

/**
 * Generate challenge data based on type
 */
function generateChallengeData(type: VisualChallengeType): unknown {
  switch (type) {
    case 'pattern':
      return {
        grid: [3, 3],
        minPoints: 4,
        showGuide: true,
      };
    case 'image_select':
      return {
        images: generateImageSet(),
        correctIndex: Math.floor(Math.random() * 9),
        prompt: 'Select the matching image',
      };
    case 'gesture':
      return {
        gestureType: ['swipe', 'tap', 'hold'][Math.floor(Math.random() * 3)],
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
      };
    case 'color_sequence':
      return {
        colors: generateColorSequence(4),
        displayTimeMs: 2000,
      };
    case 'shape_match':
      return {
        shapes: ['circle', 'square', 'triangle'],
        target: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
      };
    default:
      return {};
  }
}

/**
 * Generate a set of placeholder images for image_select challenge
 */
function generateImageSet(): string[] {
  return Array.from({ length: 9 }, (_, i) => `image_${i + 1}`);
}

/**
 * Generate a random color sequence
 */
function generateColorSequence(length: number): string[] {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  return Array.from({ length }, () => colors[Math.floor(Math.random() * colors.length)]);
}

/**
 * Verify a visual challenge response
 */
export async function verifyVisualChallenge(
  challenge: VisualChallenge,
  response: unknown
): Promise<VisualChallengeResult> {
  const now = new Date();
  
  // Check if challenge has expired
  const expirationTime = challenge.extendedUntil || challenge.expiresAt;
  if (now > expirationTime) {
    return {
      verified: false,
      challengeId: challenge.id,
      completedAt: now,
      attempts: 1,
    };
  }

  // Verify based on challenge type
  const verified = await verifyChallengeResponse(challenge, response);

  return {
    verified,
    challengeId: challenge.id,
    completedAt: now,
    attempts: 1,
  };
}

/**
 * Verify challenge response based on type
 */
async function verifyChallengeResponse(
  challenge: VisualChallenge,
  response: unknown
): Promise<boolean> {
  switch (challenge.type) {
    case 'pattern':
      return verifyPatternResponse(challenge.data, response);
    case 'image_select':
      return verifyImageSelectResponse(challenge.data, response);
    case 'gesture':
      return verifyGestureResponse(challenge.data, response);
    case 'color_sequence':
      return verifyColorSequenceResponse(challenge.data, response);
    case 'shape_match':
      return verifyShapeMatchResponse(challenge.data, response);
    default:
      return false;
  }
}

function verifyPatternResponse(_data: unknown, _response: unknown): boolean {
  // Implement pattern verification logic
  return true;
}

function verifyImageSelectResponse(data: unknown, response: unknown): boolean {
  const challengeData = data as { correctIndex: number };
  const userResponse = response as { selectedIndex: number };
  return challengeData.correctIndex === userResponse.selectedIndex;
}

function verifyGestureResponse(data: unknown, response: unknown): boolean {
  const challengeData = data as { gestureType: string; direction: string };
  const userResponse = response as { gestureType: string; direction: string };
  return (
    challengeData.gestureType === userResponse.gestureType &&
    challengeData.direction === userResponse.direction
  );
}

function verifyColorSequenceResponse(data: unknown, response: unknown): boolean {
  const challengeData = data as { colors: string[] };
  const userResponse = response as { colors: string[] };
  return JSON.stringify(challengeData.colors) === JSON.stringify(userResponse.colors);
}

function verifyShapeMatchResponse(data: unknown, response: unknown): boolean {
  const challengeData = data as { target: string };
  const userResponse = response as { selected: string };
  return challengeData.target === userResponse.selected;
}

/**
 * Extend challenge timeout
 */
export function extendChallengeTimeout(
  challenge: VisualChallenge,
  additionalMs: number
): VisualChallenge {
  const newExpiry = new Date(
    (challenge.extendedUntil || challenge.expiresAt).getTime() + additionalMs
  );
  
  return {
    ...challenge,
    extendedUntil: newExpiry,
  };
}

/**
 * Create visual feedback for challenge result
 */
export interface VisualFeedback {
  type: 'success' | 'error' | 'progress' | 'timeout_warning';
  message: string;
  iconType: string;
  color: string;
  animationType: 'pulse' | 'shake' | 'fade' | 'bounce';
}

export function createVisualFeedback(
  result: VisualChallengeResult,
  timeRemaining?: number
): VisualFeedback {
  if (result.verified) {
    return {
      type: 'success',
      message: 'Verification successful',
      iconType: 'checkmark',
      color: '#22C55E',
      animationType: 'pulse',
    };
  }

  if (timeRemaining !== undefined && timeRemaining < 30000) {
    return {
      type: 'timeout_warning',
      message: `${Math.ceil(timeRemaining / 1000)} seconds remaining`,
      iconType: 'clock',
      color: '#F59E0B',
      animationType: 'pulse',
    };
  }

  return {
    type: 'error',
    message: 'Verification failed. Please try again.',
    iconType: 'x-circle',
    color: '#EF4444',
    animationType: 'shake',
  };
}
