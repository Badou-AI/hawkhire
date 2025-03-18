'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'

interface SupabaseError {
  message?: string
  code?: string
  details?: string
  hint?: string
  [key: string]: string | undefined
}

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [authStatus, setAuthStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<SupabaseError | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('Testing Supabase connection...')
        console.log('Project URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        
        // Test basic connection using a simple health check
        const { error: pingError } = await supabase.from('_internal').select('*').limit(1)
        if (pingError) {
          // For a fresh project, any response that's not a connection error is good
          if (pingError.code === 'PGRST116' || pingError.code === '42P01') {
            // These errors just mean the table doesn't exist, which is fine
            setConnectionStatus('success')
          } else {
            console.log('Database connection error:', pingError)
            throw pingError
          }
        } else {
          setConnectionStatus('success')
        }

        // Test auth configuration by checking if we can access auth config
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError) {
          console.log('Auth configuration error:', authError)
          throw authError
        }
        console.log('Auth session state:', session ? 'Has session' : 'No session (expected)')
        setAuthStatus('success')

        // If we got here, basic connectivity is working
        if (errorMessage) {
          setErrorMessage(null)
          setDetailedError(null)
        }
      } catch (error: unknown) {
        const supabaseError = error as SupabaseError
        console.error('Connection test failed. Details:', {
          error: supabaseError,
          message: supabaseError?.message,
          code: supabaseError?.code,
          details: supabaseError?.details,
          hint: supabaseError?.hint
        })
        setConnectionStatus('error')
        setAuthStatus('error')
        setDetailedError(supabaseError)
        
        // Provide more helpful error messages for common issues
        if (supabaseError?.message?.includes('Failed to fetch')) {
          setErrorMessage('Could not reach Supabase API. Please check your project URL and network connection.')
        } else if (supabaseError?.message?.includes('JWT')) {
          setErrorMessage('Authentication error. Please check your project anon key.')
        } else {
          setErrorMessage(
            supabaseError?.message || 
            supabaseError?.details || 
            supabaseError?.hint || 
            'Unknown error occurred. Check console for details.'
          )
        }
      }
    }

    checkConnection()
  }, [supabase, errorMessage])

  const StatusIcon = ({ status }: { status: 'checking' | 'success' | 'error' }) => {
    if (status === 'checking') return null
    return status === 'success' ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">Database Connection</span>
              <p className="text-sm text-gray-500">Tests connection to Supabase project</p>
            </div>
            <StatusIcon status={connectionStatus} />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-medium">Authentication Setup</span>
              <p className="text-sm text-gray-500">Verifies auth configuration</p>
            </div>
            <StatusIcon status={authStatus} />
          </div>

          {errorMessage && (
            <div className="space-y-2">
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                {errorMessage}
              </div>
              {detailedError && (
                <div className="p-4 text-xs font-mono bg-gray-50 rounded-lg overflow-auto">
                  <pre>{JSON.stringify(detailedError, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 