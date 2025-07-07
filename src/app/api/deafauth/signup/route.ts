import { NextResponse } from 'next/server';
import { SignupSchema } from '@/lib/auth-schemas';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const validation = SignupSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, password } = validation.data;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status || 500 });
  }

  if (data.user) {
    return NextResponse.json({ success: true, message: `Account for ${name} created successfully. Please check your email to confirm.` });
  }
  
  return NextResponse.json({ success: false, message: 'An unexpected error occurred during sign up.' }, { status: 500 });
}
