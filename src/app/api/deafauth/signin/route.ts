import {NextResponse} from 'next/server';
import {LoginSchema} from '@/lib/auth-schemas';

export async function POST(request: Request) {
  const body = await request.json();
  const validation = LoginSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({errors: validation.error.flatten().fieldErrors}, {status: 400});
  }
  
  const { email, password } = validation.data;

  // Simulate user lookup
  if (email === 'test@example.com' && password === 'password123') {
    // In a real app, you'd generate a session/JWT here
    return NextResponse.json({success: true, message: 'Login successful'});
  } else {
    return NextResponse.json({success: false, message: 'Invalid email or password'}, {status: 401});
  }
}
