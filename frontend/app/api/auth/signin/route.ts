import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple in-memory cache for rate limiting
// In production, use Redis or similar for distributed environments
const signInAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 3;
const BACKOFF_TIME = 30; // seconds

// Function to validate JWT token structure and expiration
function isValidJWT(token: string): boolean {
  try {
    // Basic structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (!payload.exp) return false;
    
    // Ensure exp is a valid timestamp (not in the past and not too far in the future)
    const now = Math.floor(Date.now() / 1000);
    const maxFutureTime = now + (60 * 60 * 24 * 365); // 1 year in the future
    
    return payload.exp > now && payload.exp < maxFutureTime;
  } catch (error) {
    console.error('[Auth API] JWT validation error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown-ip';
    
    // Check rate limiting
    const now = Math.floor(Date.now() / 1000);
    const attempt = signInAttempts.get(ip);
    
    if (attempt) {
      // If we have previous attempts and they're recent
      if (now - attempt.timestamp < BACKOFF_TIME && attempt.count >= MAX_ATTEMPTS) {
        const retryAfter = BACKOFF_TIME - (now - attempt.timestamp);
        return NextResponse.json(
          { error: 'Too many sign-in attempts', retryAfter },
          { status: 429 }
        );
      }
      
      // Reset if backoff period has passed
      if (now - attempt.timestamp >= BACKOFF_TIME) {
        signInAttempts.set(ip, { count: 1, timestamp: now });
      } else {
        // Increment attempt count
        signInAttempts.set(ip, { 
          count: attempt.count + 1, 
          timestamp: attempt.timestamp 
        });
      }
    } else {
      // First attempt
      signInAttempts.set(ip, { count: 1, timestamp: now });
    }
    
    // Parse request body
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Check for existing session first
    const { data: { session } } = await supabase.auth.getSession();
    
    // If there's an existing session with a token, validate it
    if (session?.access_token) {
      // Check if the token is valid
      if (!isValidJWT(session.access_token)) {
        console.error('[Auth API] Invalid JWT token detected');
        
        // Clear the invalid session
        await supabase.auth.signOut();
        
        return NextResponse.json(
          { error: 'Invalid authentication token', invalidToken: true },
          { status: 401 }
        );
      }
    }
    
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Check if it's a JWT error
      if (error.message.includes('JWT') || error.message.includes('token')) {
        console.error('[Auth API] JWT error during sign-in:', error.message);
        
        // Clear the session
        await supabase.auth.signOut();
        
        return NextResponse.json(
          { error: 'Authentication token error', invalidToken: true },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Reset rate limiting on successful sign-in
    signInAttempts.delete(ip);
    
    // Return the user and session data in a consistent format
    return NextResponse.json({
      user: data.user,
      session: {
        expires_at: data.session?.expires_at
      }
    });
  } catch (error) {
    console.error('[Auth API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 