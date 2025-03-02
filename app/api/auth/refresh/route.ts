import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function POST() {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }
    
    // Validate the current access token
    if (!isValidJWT(session.access_token)) {
      console.log('[Auth API] Invalid access token detected during refresh');
      
      // Try to sign out to clear the invalid session
      await supabase.auth.signOut();
      
      return NextResponse.json(
        { error: 'Invalid authentication token', invalidToken: true },
        { status: 401 }
      );
    }
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[Auth API] Session refresh error:', error);
      
      // If it's a token-related error, clear the session
      if (error.message.includes('JWT') || error.message.includes('token')) {
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
    
    // Return a consistent response structure
    return NextResponse.json({ 
      user: data.user,
      session: {
        expires_at: data.session?.expires_at,
        access_token: data.session?.access_token ? '[TOKEN]' : null // Don't send the actual token
      }
    });
  } catch (error) {
    console.error('[Auth API] Unexpected error during refresh:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 