import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  console.log('[Server] Starting sign-in process');
  
  try {
    const { email, password } = await request.json();
    console.log('[Server] Received sign-in request for email:', email);
    
    // Validate input
    if (!email || !password) {
      console.log('[Server] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('[Server] Creating Supabase client with server implementation');
    // Use the server implementation that properly handles async cookies
    const supabase = createClient();
    console.log('[Server] Supabase client created');
    
    console.log('[Server] Attempting sign-in with Supabase');
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('[Server] Sign-in attempt completed');

    if (error) {
      console.error('[Server] Sign-in error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    console.log('[Server] Sign-in successful, session:', data.session ? 'exists' : 'missing');
    
    return NextResponse.json({ 
      data,
      success: true
    });
  } catch (error) {
    console.error('[Server] Unexpected error during sign-in:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 