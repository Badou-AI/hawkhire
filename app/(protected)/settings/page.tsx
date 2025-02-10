"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { OrganizationCard } from "@/components/profile/organization-card"

interface Organization {
  id: string
  name: { en: string; fr?: string }
  description: { en: string; fr?: string }
  logo_url?: string
  cover_image_url?: string
  industry?: string
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  _count?: {
    members: number
    jobs: number
  }
}

interface OrganizationMember {
  organization_id: string
  role: string
}

export default function SettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [memberships, setMemberships] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const supabase = createClient()
        const userId = (await supabase.auth.getUser()).data.user?.id

        if (!userId) {
          setLoading(false)
          return
        }
        
        // Get user's member records with roles
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', userId)

        if (!memberData?.length) {
          setLoading(false)
          return
        }

        setMemberships(memberData)

        // Get organization details with counts
        const organizationIds = memberData.map(m => m.organization_id)
        const { data: orgs } = await supabase
          .from('organizations')
          .select(`
            id, 
            name, 
            description,
            logo_url,
            cover_image_url,
            industry,
            verification_status,
            organization_members(count),
            jobs(count)
          `)
          .in('id', organizationIds)

        // Transform the data to match our interface
        const transformedOrgs = orgs?.map(org => ({
          ...org,
          _count: {
            members: org.organization_members?.[0]?.count || 0,
            jobs: org.jobs?.[0]?.count || 0
          }
        }))

        setOrganizations(transformedOrgs || [])
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>
            {/* TODO: Add profile form */}
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Organizations</h2>
            <Button asChild>
              <Link href="/organizations/create" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Loading organizations...</p>
              </Card>
            ) : organizations.length > 0 ? (
              organizations.map((org) => (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  isOwner={memberships.find(m => m.organization_id === org.id)?.role === 'OWNER'}
                />
              ))
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t created or joined any organizations yet.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">User Preferences</h2>
            {/* TODO: Add preferences form */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 