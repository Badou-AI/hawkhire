'use client'

import { type Organization } from '@/types/organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Globe, MapPin, Users, Calendar, Briefcase } from 'lucide-react'
import { OrganizationAvatar } from '@/components/ui/organization-avatar'

interface OrganizationProfileProps {
  organization: Organization
  onEdit?: () => void
}

export function OrganizationProfile({ organization, onEdit }: OrganizationProfileProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-8">
        <div className="flex items-center space-x-4">
          <OrganizationAvatar 
            name={organization.name} 
            logoUrl={organization.logo_url} 
            size={64}
          />
          <div>
            <CardTitle className="text-2xl">{organization.name}</CardTitle>
            <CardDescription>{organization.slug}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={organization.verification_status === 'verified' ? 'default' : 'secondary'}>
            {organization.verification_status}
          </Badge>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">About</h3>
          <p className="text-sm text-muted-foreground">
            {organization.description || 'No description provided'}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Company Type */}
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{organization.company_type || 'corporation'}</span>
          </div>

          {/* Founded Year */}
          {organization.founded_year && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Founded in {organization.founded_year}</span>
            </div>
          )}

          {/* Size */}
          {organization.size_range && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{organization.size_range} employees</span>
            </div>
          )}

          {/* Website */}
          {organization.website_url && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={organization.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {organization.website_url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{organization.primary_location || 'Unknown'}</span>
          </div>
        </div>

        {/* Tags */}
        {((organization.industry && organization.industry.length > 0) || 
          (organization.languages && organization.languages.length > 0)) && (
          <div className="space-y-4">
            {/* Industries */}
            {organization.industry && organization.industry.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {organization.industry.map((ind) => (
                    <Badge key={ind} variant="secondary">
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {organization.languages && organization.languages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {organization.languages.map((lang) => (
                    <Badge key={lang} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 