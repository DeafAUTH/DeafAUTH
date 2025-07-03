import { NextResponse } from 'next/server';
import { SignupSchema } from '@/lib/auth-schemas';

export async function POST(request: Request) {
  const body = await request.json();
  const validation = SignupSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email } = validation.data;

  // In a real application, you would connect to your database here
  // to create a new user with a hashed password.
  console.log(`Creating user: ${name}, ${email}`);

  // For now, we'll simulate a successful user creation.
  // We'll check for a dummy existing user to show error handling.
  if (email === 'exists@example.com') {
    return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });
  }

  return NextResponse.json({ success: true, message: `Account for ${name} created successfully.` });
}
