'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OrganizationAvatarProps {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}

export function OrganizationAvatar({ 
  name, 
  logoUrl, 
  size = 48,
  className = ''
}: OrganizationAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const firstLetter = name.charAt(0).toUpperCase()
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-red-100 text-red-600',
    'bg-purple-100 text-purple-600'
  ]
  // Use the name to consistently pick a color
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const colorClass = colors[colorIndex]

  if (!logoUrl || imageError) {
    return (
      <div 
        className={`flex items-center justify-center rounded-lg ${colorClass} ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-lg font-medium">{firstLetter}</span>
      </div>
    )
  }

  return (
    <Image
      src={logoUrl}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`rounded-lg object-contain ${className}`}
      quality={95}
      onError={() => setImageError(true)}
    />
  )
} 