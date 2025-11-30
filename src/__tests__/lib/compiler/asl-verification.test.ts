/**
 * DeafAUTH ASL Verification Runtime Tests
 */

import {
  createASLSession,
  startASLVerification,
  processASLSign,
  extendASLSession,
  isASLSessionExpired,
  getASLVerificationSummary,
  generateASLChallenge,
  createASLFeedback,
  ASL_VERIFICATION_SIGNS,
  type ASLVerificationSession,
} from '../../../lib/compiler/runtime/asl-verification';

describe('ASL Verification Runtime', () => {
  describe('createASLSession', () => {
    it('should create ASL session', () => {
      const session = createASLSession();
      
      expect(session.id).toMatch(/^asl_/);
      expect(session.status).toBe('pending');
      expect(session.attempts).toBe(0);
      expect(session.verificationResults).toHaveLength(0);
    });

    it('should create session with user ID', () => {
      const session = createASLSession('user-123');
      
      expect(session.userId).toBe('user-123');
    });

    it('should respect custom config', () => {
      const session = createASLSession(undefined, {
        maxAttempts: 5,
        timeoutMs: 600000,
      });
      
      expect(session.maxAttempts).toBe(5);
    });
  });

  describe('startASLVerification', () => {
    it('should change status to in_progress', () => {
      const session = createASLSession();
      const started = startASLVerification(session);
      
      expect(started.status).toBe('in_progress');
    });
  });

  describe('processASLSign', () => {
    it('should process successful sign detection', () => {
      const session = createASLSession();
      const result = processASLSign(session, 'yes', 'yes', 0.9);
      
      expect(result.status).toBe('completed');
      expect(result.attempts).toBe(1);
      expect(result.verificationResults).toHaveLength(1);
      expect(result.verificationResults[0].passed).toBe(true);
    });

    it('should fail on low confidence', () => {
      const session = createASLSession();
      const result = processASLSign(session, 'yes', 'yes', 0.5);
      
      expect(result.status).not.toBe('completed');
      expect(result.verificationResults[0].passed).toBe(false);
    });

    it('should fail on wrong sign', () => {
      const session = createASLSession();
      const result = processASLSign(session, 'no', 'yes', 0.9);
      
      expect(result.status).not.toBe('completed');
      expect(result.verificationResults[0].passed).toBe(false);
    });

    it('should fail after max attempts', () => {
      let session = createASLSession(undefined, { maxAttempts: 2 });
      session = processASLSign(session, 'wrong', 'yes', 0.9);
      session = processASLSign(session, 'wrong', 'yes', 0.9);
      
      expect(session.status).toBe('failed');
      expect(session.attempts).toBe(2);
    });

    it('should track multiple attempts', () => {
      let session = createASLSession();
      session = processASLSign(session, 'wrong', 'yes', 0.9);
      session = processASLSign(session, 'yes', 'yes', 0.9);
      
      expect(session.status).toBe('completed');
      expect(session.attempts).toBe(2);
      expect(session.verificationResults).toHaveLength(2);
    });
  });

  describe('extendASLSession', () => {
    it('should extend session timeout', () => {
      const session = createASLSession();
      const originalExpiry = session.expiresAt.getTime();
      
      const extended = extendASLSession(session, 60000);
      
      expect(extended.expiresAt.getTime()).toBe(originalExpiry + 60000);
    });
  });

  describe('isASLSessionExpired', () => {
    it('should return false for active session', () => {
      const session = createASLSession();
      
      expect(isASLSessionExpired(session)).toBe(false);
    });

    it('should return true for expired session', () => {
      const session = createASLSession();
      const expiredSession: ASLVerificationSession = {
        ...session,
        expiresAt: new Date(Date.now() - 1000),
      };
      
      expect(isASLSessionExpired(expiredSession)).toBe(true);
    });
  });

  describe('getASLVerificationSummary', () => {
    it('should return summary for session', () => {
      const session = createASLSession();
      const summary = getASLVerificationSummary(session);
      
      expect(summary.sessionId).toBe(session.id);
      expect(summary.status).toBe('pending');
      expect(summary.totalAttempts).toBe(0);
      expect(summary.fallbackRecommended).toBe(false);
    });

    it('should calculate average confidence', () => {
      let session = createASLSession();
      session = processASLSign(session, 'wrong', 'yes', 0.6);
      session = processASLSign(session, 'wrong', 'yes', 0.8);
      
      const summary = getASLVerificationSummary(session);
      
      expect(summary.averageConfidence).toBe(0.7);
    });

    it('should recommend fallback on failure', () => {
      let session = createASLSession(undefined, { maxAttempts: 1 });
      session = processASLSign(session, 'wrong', 'yes', 0.9);
      
      const summary = getASLVerificationSummary(session);
      
      expect(summary.fallbackRecommended).toBe(true);
    });
  });

  describe('generateASLChallenge', () => {
    it('should generate random challenge', () => {
      const challenge = generateASLChallenge();
      
      expect(challenge.sign).toBeDefined();
      expect(challenge.description).toBeDefined();
      expect(ASL_VERIFICATION_SIGNS.some(s => s.name === challenge.sign)).toBe(true);
    });
  });

  describe('createASLFeedback', () => {
    it('should create detecting feedback for pending session', () => {
      const session = createASLSession();
      const feedback = createASLFeedback(session);
      
      expect(feedback.type).toBe('detecting');
      expect(feedback.message).toContain('Position your hands');
    });

    it('should create success feedback for completed session', () => {
      let session = createASLSession();
      session = processASLSign(session, 'yes', 'yes', 0.9);
      
      const feedback = createASLFeedback(session);
      
      expect(feedback.type).toBe('success');
      expect(feedback.progress).toBe(100);
    });

    it('should create fallback feedback for failed session', () => {
      let session = createASLSession(undefined, { maxAttempts: 1 });
      session = processASLSign(session, 'wrong', 'yes', 0.9);
      
      const feedback = createASLFeedback(session);
      
      expect(feedback.type).toBe('fallback_available');
    });

    it('should create retry feedback with current result', () => {
      let session = createASLSession();
      session = processASLSign(session, 'wrong', 'yes', 0.6);
      const lastResult = session.verificationResults[0];
      
      const feedback = createASLFeedback(session, lastResult);
      
      expect(feedback.type).toBe('retry');
      expect(feedback.message).toContain('60% confidence');
    });
  });

  describe('ASL_VERIFICATION_SIGNS', () => {
    it('should have verification signs defined', () => {
      expect(ASL_VERIFICATION_SIGNS.length).toBeGreaterThan(0);
    });

    it('should have name and description for each sign', () => {
      ASL_VERIFICATION_SIGNS.forEach(sign => {
        expect(sign.name).toBeDefined();
        expect(sign.description).toBeDefined();
      });
    });
  });
});
