'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

export function JobFilters() {
  const [isRemoteOnly, setIsRemoteOnly] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])

  // This would typically come from a geolocation service
  // For now using mock data
  const nearbyLocations = [
    { name: 'San Francisco Bay Area', count: 234 },
    { name: 'South Bay', count: 156 },
    { name: 'East Bay', count: 98 },
    { name: 'Peninsula', count: 167 },
    { name: 'North Bay', count: 45 },
    { name: 'Sacramento', count: 78 }
  ]
  
  return (
    <div className="space-y-8">
      {/* Easy Apply Filter */}
      <div className="flex items-center gap-2">
        <Checkbox id="easy-apply" />
        <label htmlFor="easy-apply" className="text-sm font-medium">
          Easy Apply Only
        </label>
      </div>

      {/* Sectors */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Sectors</h3>
        <div className="space-y-3">
          {[
            { name: 'Information Technology', count: 168 },
            { name: 'Transformation & Logistics', count: 56 },
            { name: 'Media', count: 2 },
            { name: 'Art & Entertainment', count: 234 },
            { name: 'Telecommunication', count: 45 },
            { name: 'Healthcare', count: 23 },
            { name: 'Finance', count: 12 },
            { name: 'Customer Service', count: 12 },
            { name: 'Manufacturing', count: 45 },
            { name: 'Retail', count: 90 }
          ].map((sector) => (
            <div key={sector.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id={sector.name} />
                <label htmlFor={sector.name} className="text-sm text-gray-600">
                  {sector.name}
                </label>
              </div>
              <span className="text-sm text-gray-400">{sector.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Employment Type */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Employment Type</h3>
        <div className="space-y-3">
          {[
            'Full-time',
            'Part-time',
            'Contract',
            'Temporary',
            'Internship',
            'Freelance'
          ].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox id={type} />
              <label htmlFor={type} className="text-sm text-gray-600">
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Employer Type */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Employer Type</h3>
        <div className="space-y-3">
          {[
            'Direct Hire',
            'Agency',
            'Startup',
            'Enterprise',
            'Non-profit',
            'Government'
          ].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox id={type} />
              <label htmlFor={type} className="text-sm text-gray-600">
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Work Settings */}
      <div>
        <h3 className="mb-4 text-lg font-medium">Work Settings</h3>
        <div className="space-y-3">
          {[
            'Remote',
            'Hybrid',
            'On-site',
            'Flexible Schedule',
            'Fixed Schedule'
          ].map((setting) => (
            <div key={setting} className="flex items-center gap-2">
              <Checkbox 
                id={setting} 
                onCheckedChange={(checked) => {
                  if (setting === 'Remote') {
                    setIsRemoteOnly(checked as boolean)
                  }
                }}
              />
              <label htmlFor={setting} className="text-sm text-gray-600">
                {setting}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Locations - Only show when Remote is not checked */}
      {!isRemoteOnly && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Locations Near You</h3>
            <span className="text-sm text-gray-500">within 50 miles</span>
          </div>
          <div className="space-y-3">
            {nearbyLocations.map((location) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={location.name}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLocations([...selectedLocations, location.name])
                      } else {
                        setSelectedLocations(selectedLocations.filter(loc => loc !== location.name))
                      }
                    }}
                  />
                  <label htmlFor={location.name} className="text-sm text-gray-600">
                    {location.name}
                  </label>
                </div>
                <span className="text-sm text-gray-400">{location.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 