import {NextResponse} from 'next/server';
import {LoginSchema} from '@/lib/auth-schemas';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const validation = LoginSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({errors: validation.error.flatten().fieldErrors}, {status: 400});
  }
  
  const { email, password } = validation.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 401 });
  }

  return NextResponse.json({ success: true, message: 'Login successful' });
}
