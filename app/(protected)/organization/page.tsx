'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Organization } from '@/types/organization'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { OrganizationProfile } from '@/components/organization/profile'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function OrganizationPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .contains('members', [user.email])
          .single()

        if (orgError) throw orgError
        setOrganization(data)
      } catch (err) {
        console.error('Error fetching organization:', err)
        setError('Failed to load organization details. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-[250px]" />
        <Card className="p-6">
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!organization) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Organization Found</AlertTitle>
        <AlertDescription>
          You are not a member of any organization. Please create or join one to continue.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Organization Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <OrganizationProfile
            organization={organization}
            onEdit={() => {
              // TODO: Implement edit functionality
              console.log('Edit clicked')
            }}
          />
        </TabsContent>

        <TabsContent value="team">
          {/* TODO: Add team management component */}
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Team management coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          {/* TODO: Add billing management component */}
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Billing management coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 