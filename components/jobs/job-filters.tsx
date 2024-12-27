'use client'

import { Checkbox } from '@/components/ui/checkbox'
//import { useState } from 'react'

export function JobFilters() {
  //const [jobAlerts, setJobAlerts] = useState(false)
  
  return (
    <div className="space-y-8">
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

      <div>
        <h3 className="mb-4 text-lg font-medium">Company size</h3>
        <div className="space-y-3">
          {[
            '1-10',
            '11-50',
            '51-200',
            '201-500',
            '501-1000',
            '1001-5000',
            '5001+'
          ].map((size) => (
            <div key={size} className="flex items-center gap-2">
              <Checkbox id={size} />
              <label htmlFor={size} className="text-sm text-gray-600">
                {size} employees
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 