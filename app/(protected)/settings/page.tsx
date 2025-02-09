"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Organization {
  id: string
  name: { en: string; fr?: string }
  logo_url?: string
  industry?: string
}

export default function SettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const supabase = createClient()
        
        // Get user's member records
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

        if (!memberData?.length) {
          setLoading(false)
          return
        }

        // Get organization details
        const organizationIds = memberData.map(m => m.organization_id)
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, logo_url, industry')
          .in('id', organizationIds)

        setOrganizations(orgs || [])
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

          <Card className="p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading organizations...</p>
            ) : organizations.length > 0 ? (
              <div className="grid gap-4">
                {organizations.map((org) => (
                  <Link 
                    key={org.id} 
                    href={`/organizations/${org.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted rounded-lg transition-colors"
                  >
                    {org.logo_url && (
                      <img 
                        src={org.logo_url} 
                        alt={org.name.en} 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{org.name.en}</h3>
                      {org.industry && (
                        <p className="text-sm text-muted-foreground">{org.industry}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t created or joined any organizations yet.
              </p>
            )}
          </Card>
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