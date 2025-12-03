import {NextResponse} from 'next/server';

// In a real app, you would have session management to identify the user
// and fetch their actual profile from a database.
export async function GET() {
  // For demonstration, we'll return mock data.
  const userProfile = {
    id: 'user-123',
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    isAslVerified: true,
    communityStanding: 'Trusted Member',
    signLanguageProficiency: 'Fluent',
    profileImageUrl: 'https://placehold.co/100x100.png',
  };

  return NextResponse.json(userProfile);
}
