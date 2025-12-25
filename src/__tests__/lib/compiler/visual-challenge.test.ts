/**
 * DeafAUTH Visual Challenge Runtime Tests
 */

import {
  generateVisualChallenge,
  verifyVisualChallenge,
  extendChallengeTimeout,
  createVisualFeedback,
  type VisualChallenge,
  type VisualChallengeType,
  type VisualChallengeResult,
} from '../../../lib/compiler/runtime/visual-challenge';

describe('Visual Challenge Runtime', () => {
  describe('generateVisualChallenge', () => {
    it('should generate pattern challenge', () => {
      const challenge = generateVisualChallenge('pattern');
      
      expect(challenge.type).toBe('pattern');
      expect(challenge.id).toMatch(/^vc_/);
      expect(challenge.createdAt).toBeInstanceOf(Date);
      expect(challenge.expiresAt).toBeInstanceOf(Date);
      expect(challenge.data).toBeDefined();
    });

    it('should generate image_select challenge', () => {
      const challenge = generateVisualChallenge('image_select');
      
      expect(challenge.type).toBe('image_select');
      expect(challenge.data).toHaveProperty('images');
      expect(challenge.data).toHaveProperty('correctIndex');
    });

    it('should generate gesture challenge', () => {
      const challenge = generateVisualChallenge('gesture');
      
      expect(challenge.type).toBe('gesture');
      expect(challenge.data).toHaveProperty('gestureType');
      expect(challenge.data).toHaveProperty('direction');
    });

    it('should generate color_sequence challenge', () => {
      const challenge = generateVisualChallenge('color_sequence');
      
      expect(challenge.type).toBe('color_sequence');
      expect(challenge.data).toHaveProperty('colors');
      expect(challenge.data).toHaveProperty('displayTimeMs');
    });

    it('should generate shape_match challenge', () => {
      const challenge = generateVisualChallenge('shape_match');
      
      expect(challenge.type).toBe('shape_match');
      expect(challenge.data).toHaveProperty('shapes');
      expect(challenge.data).toHaveProperty('target');
    });

    it('should respect custom timeout config', () => {
      const challenge = generateVisualChallenge('pattern', {
        defaultTimeoutMs: 30000,
        extendedTimeoutMs: 600000,
      });
      
      const expectedExpiry = challenge.createdAt.getTime() + 30000;
      expect(challenge.expiresAt.getTime()).toBe(expectedExpiry);
    });

    it('should include extended timeout', () => {
      const challenge = generateVisualChallenge('pattern');
      
      expect(challenge.extendedUntil).toBeInstanceOf(Date);
      expect(challenge.extendedUntil!.getTime()).toBeGreaterThan(
        challenge.expiresAt.getTime()
      );
    });
  });

  describe('verifyVisualChallenge', () => {
    it('should verify pattern response correctly', async () => {
      const challenge = generateVisualChallenge('pattern');
      const data = challenge.data as { grid: number[]; minPoints: number };
      
      // Valid pattern with minimum points
      const result = await verifyVisualChallenge(challenge, {
        pattern: [0, 1, 2, 3], // 4 points, min is 4
      });
      
      expect(result.verified).toBe(true);
    });

    it('should fail pattern with too few points', async () => {
      const challenge = generateVisualChallenge('pattern');
      
      const result = await verifyVisualChallenge(challenge, {
        pattern: [0, 1], // Only 2 points, min is 4
      });
      
      expect(result.verified).toBe(false);
    });

    it('should fail pattern with duplicate consecutive points', async () => {
      const challenge = generateVisualChallenge('pattern');
      
      const result = await verifyVisualChallenge(challenge, {
        pattern: [0, 1, 1, 2], // Duplicate consecutive point
      });
      
      expect(result.verified).toBe(false);
    });

    it('should verify image_select response correctly', async () => {
      const challenge = generateVisualChallenge('image_select');
      const correctIndex = (challenge.data as { correctIndex: number }).correctIndex;
      
      const result = await verifyVisualChallenge(challenge, {
        selectedIndex: correctIndex,
      });
      
      expect(result.verified).toBe(true);
      expect(result.challengeId).toBe(challenge.id);
    });

    it('should fail incorrect image_select response', async () => {
      const challenge = generateVisualChallenge('image_select');
      const correctIndex = (challenge.data as { correctIndex: number }).correctIndex;
      const wrongIndex = (correctIndex + 1) % 9;
      
      const result = await verifyVisualChallenge(challenge, {
        selectedIndex: wrongIndex,
      });
      
      expect(result.verified).toBe(false);
    });

    it('should verify gesture response correctly', async () => {
      const challenge = generateVisualChallenge('gesture');
      const data = challenge.data as { gestureType: string; direction: string };
      
      const result = await verifyVisualChallenge(challenge, {
        gestureType: data.gestureType,
        direction: data.direction,
      });
      
      expect(result.verified).toBe(true);
    });

    it('should verify color_sequence response correctly', async () => {
      const challenge = generateVisualChallenge('color_sequence');
      const data = challenge.data as { colors: string[] };
      
      const result = await verifyVisualChallenge(challenge, {
        colors: data.colors,
      });
      
      expect(result.verified).toBe(true);
    });

    it('should fail verification for expired challenge', async () => {
      const challenge = generateVisualChallenge('pattern');
      // Manually expire the challenge
      const expiredChallenge: VisualChallenge = {
        ...challenge,
        expiresAt: new Date(Date.now() - 1000),
        extendedUntil: new Date(Date.now() - 500),
      };
      
      const result = await verifyVisualChallenge(expiredChallenge, {});
      
      expect(result.verified).toBe(false);
    });
  });

  describe('extendChallengeTimeout', () => {
    it('should extend challenge timeout', () => {
      const challenge = generateVisualChallenge('pattern');
      const originalExpiry = challenge.extendedUntil!.getTime();
      
      const extended = extendChallengeTimeout(challenge, 60000);
      
      expect(extended.extendedUntil!.getTime()).toBe(originalExpiry + 60000);
    });

    it('should use expiresAt if extendedUntil not set', () => {
      const challenge = generateVisualChallenge('pattern');
      const challengeWithoutExtended: VisualChallenge = {
        ...challenge,
        extendedUntil: undefined,
      };
      
      const extended = extendChallengeTimeout(challengeWithoutExtended, 60000);
      
      expect(extended.extendedUntil!.getTime()).toBe(
        challenge.expiresAt.getTime() + 60000
      );
    });
  });

  describe('createVisualFeedback', () => {
    it('should create success feedback', () => {
      const result: VisualChallengeResult = {
        verified: true,
        challengeId: 'test-id',
        completedAt: new Date(),
        attempts: 1,
      };
      
      const feedback = createVisualFeedback(result);
      
      expect(feedback.type).toBe('success');
      expect(feedback.color).toBe('#22C55E');
    });

    it('should create error feedback', () => {
      const result: VisualChallengeResult = {
        verified: false,
        challengeId: 'test-id',
        completedAt: new Date(),
        attempts: 1,
      };
      
      const feedback = createVisualFeedback(result);
      
      expect(feedback.type).toBe('error');
      expect(feedback.color).toBe('#EF4444');
    });

    it('should create timeout warning feedback', () => {
      const result: VisualChallengeResult = {
        verified: false,
        challengeId: 'test-id',
        completedAt: new Date(),
        attempts: 1,
      };
      
      const feedback = createVisualFeedback(result, 20000); // 20 seconds remaining
      
      expect(feedback.type).toBe('timeout_warning');
      expect(feedback.message).toContain('seconds remaining');
    });
  });
});
