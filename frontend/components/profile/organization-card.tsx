import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Briefcase,
    Edit,
    UserPlus,
    Plus,
    CheckCircle,
    Shield
} from 'lucide-react'

interface OrganizationCardProps {
  organization: {
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
  isOwner: boolean
}

export function OrganizationCard({ organization, isOwner }: OrganizationCardProps) {
  const isVerified = organization.verification_status === 'VERIFIED'

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Logo and Cover */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <div className="relative w-16 h-16">
                  <Image
                    src={organization.logo_url}
                    alt={organization.name.en}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{organization.name.en}</h3>
                  {isVerified && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                {organization.industry && (
                  <p className="text-sm text-muted-foreground">
                    {organization.industry}
                  </p>
                )}
              </div>
            </div>
          </div>

          {organization.cover_image_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image
                src={organization.cover_image_url}
                alt={`${organization.name.en} cover`}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Right Column - Info and Actions */}
        <div className="space-y-6">
          <div className="prose prose-sm">
            <p>{organization.description?.en}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {organization._count?.members || 0} members
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {organization._count?.jobs || 0} jobs
            </Badge>
            {!isVerified && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Not Verified
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {isOwner && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/organizations/${organization.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/organizations/${organization.id}/members/invite`}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/organizations/${organization.id}/jobs/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Link>
            </Button>
            {!isVerified && isOwner && (
              <Button asChild variant="default" size="sm">
                <Link href={`/organizations/${organization.id}/verify`}>
                  <Shield className="h-4 w-4 mr-2" />
                  Get Verified
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
} 