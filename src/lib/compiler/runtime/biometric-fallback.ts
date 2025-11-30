/**
 * DeafAUTH Biometric Fallback Runtime
 * Provides alternative biometric authentication methods
 */

export type BiometricMethod = 
  | 'fingerprint' 
  | 'face_recognition' 
  | 'iris_scan'
  | 'palm_recognition'
  | 'visual_pattern';

export interface BiometricSession {
  id: string;
  userId?: string;
  method: BiometricMethod;
  status: BiometricStatus;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  result?: BiometricResult;
}

export type BiometricStatus = 
  | 'pending' 
  | 'scanning' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'expired';

export interface BiometricResult {
  verified: boolean;
  method: BiometricMethod;
  confidence: number;
  timestamp: Date;
  deviceInfo?: string;
}

export interface BiometricConfig {
  timeoutMs: number;
  extendedTimeoutMs: number;
  confidenceThreshold: number;
  maxAttempts: number;
  preferredMethods: BiometricMethod[];
  fallbackEnabled: boolean;
}

const DEFAULT_BIOMETRIC_CONFIG: BiometricConfig = {
  timeoutMs: 120000, // 2 minutes
  extendedTimeoutMs: 300000, // 5 minutes
  confidenceThreshold: 0.85,
  maxAttempts: 3,
  preferredMethods: ['fingerprint', 'face_recognition', 'visual_pattern'],
  fallbackEnabled: true,
};

/**
 * Check device biometric capabilities
 */
export interface BiometricCapabilities {
  available: boolean;
  methods: BiometricMethod[];
  platformSupport: 'native' | 'webauthn' | 'none';
  requiresUserActivation: boolean;
}

export function checkBiometricCapabilities(): BiometricCapabilities {
  // In a real implementation, this would check the actual device capabilities
  return {
    available: true,
    methods: ['fingerprint', 'face_recognition', 'visual_pattern'],
    platformSupport: 'webauthn',
    requiresUserActivation: true,
  };
}

/**
 * Create a biometric session
 */
export function createBiometricSession(
  method: BiometricMethod,
  userId?: string,
  config: Partial<BiometricConfig> = {}
): BiometricSession {
  const mergedConfig = { ...DEFAULT_BIOMETRIC_CONFIG, ...config };
  const now = new Date();

  return {
    id: `bio_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    method,
    status: 'pending',
    createdAt: now,
    expiresAt: new Date(now.getTime() + mergedConfig.timeoutMs),
    attempts: 0,
    maxAttempts: mergedConfig.maxAttempts,
  };
}

/**
 * Start biometric scanning
 */
export function startBiometricScan(
  session: BiometricSession
): BiometricSession {
  return {
    ...session,
    status: 'scanning',
  };
}

/**
 * Process biometric scan result
 */
export function processBiometricResult(
  session: BiometricSession,
  confidence: number,
  deviceInfo?: string,
  config: Partial<BiometricConfig> = {}
): BiometricSession {
  const mergedConfig = { ...DEFAULT_BIOMETRIC_CONFIG, ...config };
  const verified = confidence >= mergedConfig.confidenceThreshold;

  const result: BiometricResult = {
    verified,
    method: session.method,
    confidence,
    timestamp: new Date(),
    deviceInfo,
  };

  const updatedSession: BiometricSession = {
    ...session,
    status: 'processing',
    attempts: session.attempts + 1,
    result,
  };

  if (verified) {
    return {
      ...updatedSession,
      status: 'completed',
    };
  }

  if (updatedSession.attempts >= updatedSession.maxAttempts) {
    return {
      ...updatedSession,
      status: 'failed',
    };
  }

  return {
    ...updatedSession,
    status: 'pending',
  };
}

/**
 * Get fallback biometric method
 */
export function getFallbackMethod(
  currentMethod: BiometricMethod,
  config: Partial<BiometricConfig> = {}
): BiometricMethod | null {
  const mergedConfig = { ...DEFAULT_BIOMETRIC_CONFIG, ...config };
  const currentIndex = mergedConfig.preferredMethods.indexOf(currentMethod);
  
  if (currentIndex === -1 || currentIndex >= mergedConfig.preferredMethods.length - 1) {
    return null;
  }

  return mergedConfig.preferredMethods[currentIndex + 1];
}

/**
 * Extend biometric session timeout
 */
export function extendBiometricSession(
  session: BiometricSession,
  additionalMs: number
): BiometricSession {
  return {
    ...session,
    expiresAt: new Date(session.expiresAt.getTime() + additionalMs),
  };
}

/**
 * Check if session is expired
 */
export function isBiometricSessionExpired(session: BiometricSession): boolean {
  return new Date() > session.expiresAt;
}

/**
 * Visual feedback for biometric verification
 */
export interface BiometricVisualFeedback {
  type: 'ready' | 'scanning' | 'processing' | 'success' | 'retry' | 'fallback';
  message: string;
  icon: string;
  color: string;
  showProgress: boolean;
  progress?: number;
}

export function createBiometricFeedback(
  session: BiometricSession
): BiometricVisualFeedback {
  switch (session.status) {
    case 'pending':
      return {
        type: 'ready',
        message: `Ready for ${formatBiometricMethod(session.method)} verification`,
        icon: getBiometricIcon(session.method),
        color: '#3B82F6',
        showProgress: false,
      };

    case 'scanning':
      return {
        type: 'scanning',
        message: `Scanning ${formatBiometricMethod(session.method)}...`,
        icon: getBiometricIcon(session.method),
        color: '#8B5CF6',
        showProgress: true,
        progress: 50,
      };

    case 'processing':
      return {
        type: 'processing',
        message: 'Processing biometric data...',
        icon: 'loader',
        color: '#F59E0B',
        showProgress: true,
        progress: 75,
      };

    case 'completed':
      return {
        type: 'success',
        message: 'Biometric verification successful',
        icon: 'check-circle',
        color: '#22C55E',
        showProgress: true,
        progress: 100,
      };

    case 'failed':
      const fallback = getFallbackMethod(session.method);
      if (fallback) {
        return {
          type: 'fallback',
          message: `${formatBiometricMethod(session.method)} failed. Try ${formatBiometricMethod(fallback)}?`,
          icon: 'alert-circle',
          color: '#F59E0B',
          showProgress: false,
        };
      }
      return {
        type: 'retry',
        message: 'Biometric verification failed. Please contact support.',
        icon: 'x-circle',
        color: '#EF4444',
        showProgress: false,
      };

    case 'expired':
      return {
        type: 'retry',
        message: 'Session expired. Please try again.',
        icon: 'clock',
        color: '#EF4444',
        showProgress: false,
      };

    default:
      return {
        type: 'ready',
        message: 'Biometric verification',
        icon: 'fingerprint',
        color: '#3B82F6',
        showProgress: false,
      };
  }
}

/**
 * Format biometric method name for display
 */
function formatBiometricMethod(method: BiometricMethod): string {
  const names: Record<BiometricMethod, string> = {
    fingerprint: 'Fingerprint',
    face_recognition: 'Face Recognition',
    iris_scan: 'Iris Scan',
    palm_recognition: 'Palm Recognition',
    visual_pattern: 'Visual Pattern',
  };
  return names[method] || method;
}

/**
 * Get icon for biometric method
 */
function getBiometricIcon(method: BiometricMethod): string {
  const icons: Record<BiometricMethod, string> = {
    fingerprint: 'fingerprint',
    face_recognition: 'scan-face',
    iris_scan: 'eye',
    palm_recognition: 'hand',
    visual_pattern: 'grid',
  };
  return icons[method] || 'shield';
}

/**
 * Accessibility-aware biometric instructions
 */
export interface BiometricInstructions {
  method: BiometricMethod;
  steps: string[];
  visualGuide: string;
  estimatedTimeSeconds: number;
}

export function getBiometricInstructions(method: BiometricMethod): BiometricInstructions {
  const instructions: Record<BiometricMethod, BiometricInstructions> = {
    fingerprint: {
      method: 'fingerprint',
      steps: [
        'Place your finger on the sensor',
        'Hold steady for 2 seconds',
        'Lift when you see the green indicator',
      ],
      visualGuide: 'fingerprint-guide',
      estimatedTimeSeconds: 5,
    },
    face_recognition: {
      method: 'face_recognition',
      steps: [
        'Position your face in the frame',
        'Look directly at the camera',
        'Hold still until the scan completes',
      ],
      visualGuide: 'face-guide',
      estimatedTimeSeconds: 8,
    },
    iris_scan: {
      method: 'iris_scan',
      steps: [
        'Position your eyes in the scan area',
        'Keep your eyes open and focused',
        'Stay still during the scan',
      ],
      visualGuide: 'iris-guide',
      estimatedTimeSeconds: 10,
    },
    palm_recognition: {
      method: 'palm_recognition',
      steps: [
        'Place your palm over the sensor',
        'Keep your fingers slightly spread',
        'Hold position until confirmed',
      ],
      visualGuide: 'palm-guide',
      estimatedTimeSeconds: 6,
    },
    visual_pattern: {
      method: 'visual_pattern',
      steps: [
        'Connect at least 4 dots',
        'Draw your unique pattern',
        'Lift your finger to confirm',
      ],
      visualGuide: 'pattern-guide',
      estimatedTimeSeconds: 5,
    },
  };

  return instructions[method] || instructions.fingerprint;
}
