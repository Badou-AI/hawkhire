import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOrganization() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchOrganizationId() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return null
        }

        // Get user's member records
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single()

        if (memberData) {
          setOrganizationId(memberData.organization_id)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizationId()
  }, [])

  return { organizationId, loading, error }
} 