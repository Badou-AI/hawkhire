'use client'

import { UploadDropzone } from '@/lib/uploadthing'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

type FileRouter = keyof OurFileRouter

interface FileUploadProps {
  endpoint: FileRouter
  value: string
  onChange: (url?: string) => void
}

export function FileUpload({ endpoint, value, onChange }: FileUploadProps) {
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => onChange(res?.[0].url)}
      onUploadError={(error: Error) => console.error(error)}
    />
  )
} 