import { createClient } from '@/lib/supabase/client';

export async function uploadImage(file: File, folder: string = 'misc'): Promise<{ url: string; path: string }> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch('/api/v1/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to upload image')
  }

  return response.json()
} 