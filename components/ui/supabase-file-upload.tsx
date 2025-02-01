'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

type FileType = 'company_logo' | 'company_document'

interface SupabaseFileUploadProps {
  fileType: FileType
  onUploadComplete: (url: string) => void
  onError?: (error: string) => void
}

export function SupabaseFileUpload({
  fileType,
  onUploadComplete,
  onError
}: SupabaseFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClientComponentClient()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      event.preventDefault() // Prevent form submission
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file size
      const maxSize = fileType === 'company_logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024 // 2MB for logos, 5MB for docs
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${fileType}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      onUploadComplete(publicUrl)
      toast({
        title: 'File uploaded successfully',
        description: 'Your file has been uploaded and attached to the form.'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      onError?.(message)
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        accept={fileType === 'company_logo' ? 'image/*' : '.pdf,.doc,.docx'}
      />
      <p className="text-sm text-muted-foreground">
        {uploading ? 'Uploading...' : 
          fileType === 'company_logo' 
            ? 'Upload company logo (max 2MB, PNG/JPG)'
            : 'Upload document (max 5MB, PDF/DOC)'}
      </p>
    </div>
  )
} 