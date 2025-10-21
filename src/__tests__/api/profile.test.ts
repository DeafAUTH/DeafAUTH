import { NextResponse } from 'next/server';
import { GET } from '@/app/api/deafauth/profile/route';

// Mock NextResponse for testing
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      json: async () => data,
      status: 200,
    })),
  },
}));

describe('Profile API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user profile data', async () => {
    // Create a minimal mock request object
    const mockRequest = {} as Request;
    
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(NextResponse.json).toHaveBeenCalled();
    expect(data).toBeDefined();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('isAslVerified');
    expect(data).toHaveProperty('communityStanding');
    expect(data).toHaveProperty('signLanguageProficiency');
    expect(data).toHaveProperty('profileImageUrl');
  });

  it('should return correct profile structure', async () => {
    const mockRequest = {} as Request;
    
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(typeof data.id).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(typeof data.email).toBe('string');
    expect(typeof data.isAslVerified).toBe('boolean');
    expect(typeof data.communityStanding).toBe('string');
    expect(typeof data.signLanguageProficiency).toBe('string');
    expect(typeof data.profileImageUrl).toBe('string');
  });

  it('should include valid email format in profile', async () => {
    const mockRequest = {} as Request;
    
    const response = await GET(mockRequest);
    const data = await response.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(data.email).toMatch(emailRegex);
  });
});
