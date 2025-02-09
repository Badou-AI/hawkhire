import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, Users } from 'lucide-react'

interface OrganizationProfileProps {
  organization: {
    name: { en: string; fr?: string }
    description: { en: string; fr?: string }
    logo_url?: string
    cover_image_url?: string
    industry?: string
    company_type?: string
    size_range?: string
    website_url?: string
    primary_location?: {
      city: { en: string; fr?: string }
      state: { en: string; fr?: string }
      country: { en: string; fr?: string }
    }
  }
}

export function OrganizationProfile({ organization }: OrganizationProfileProps) {
  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      {organization.cover_image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={organization.cover_image_url}
            alt={`${organization.name.en} cover`}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Logo */}
          {organization.logo_url && (
            <div className="relative h-24 w-24 flex-shrink-0">
              <Image
                src={organization.logo_url}
                alt={`${organization.name.en} logo`}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{organization.name.en}</h2>
              {organization.name.fr && (
                <p className="text-sm text-gray-500">{organization.name.fr}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {organization.industry && (
                <Badge variant="secondary">{organization.industry}</Badge>
              )}
              {organization.company_type && (
                <Badge variant="secondary">{organization.company_type}</Badge>
              )}
              {organization.size_range && (
                <Badge variant="secondary">
                  <Users className="mr-1 h-3 w-3" />
                  {organization.size_range} employees
                </Badge>
              )}
            </div>

            {/* Location and Website */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {organization.primary_location && (
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>
                    {[
                      organization.primary_location.city?.en,
                      organization.primary_location.state?.en,
                      organization.primary_location.country?.en,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              {organization.website_url && (
                <a
                  href={organization.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  <Globe className="mr-1 h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
} 