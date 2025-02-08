"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
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
            {/* TODO: Add organization list */}
            <p className="text-sm text-muted-foreground">
              You haven&apos;t created or joined any organizations yet.
            </p>
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