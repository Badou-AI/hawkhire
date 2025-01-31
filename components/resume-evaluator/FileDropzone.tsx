'use client'

import { FileType, Upload, AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  maxSize?: number // in MB
  acceptedTypes?: string[]
  description?: string
  fileTypeDescription?: string
  className?: string
}

export function FileDropzone({
  onFileSelect,
  disabled = false,
  maxSize = 500,
  acceptedTypes = ['.zip'],
  description = "Drag and drop your file here",
  fileTypeDescription = "ZIP files only",
  className
}: FileDropzoneProps) {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    
    if (!file) return
    
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      // You might want to handle this error through a callback
      console.error(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`)
      return
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      console.error(`File size exceeds ${maxSize}MB limit`)
      return
    }

    onFileSelect(file)
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center space-y-4",
        "hover:border-primary/50 transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
      onDrop={disabled ? undefined : handleDrop}
      onDragOver={handleDragOver}
      onClick={() => {
        if (!disabled) {
          const input = document.getElementById('file-upload') as HTMLInputElement
          if (input) {
            input.click()
          }
        }
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-lg font-medium">{description}</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileType className="h-4 w-4" />
          <span>{fileTypeDescription}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          <span>Max size: {maxSize}MB</span>
        </div>
      </div>

      <input
        id="file-upload"
        type="file"
        accept={acceptedTypes.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            // Check file type
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
            if (!acceptedTypes.includes(fileExtension)) {
              console.error(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`)
              return
            }

            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
              console.error(`File size exceeds ${maxSize}MB limit`)
              return
            }

            onFileSelect(file)
            // Reset the input value to allow selecting the same file again
            e.target.value = ''
          }
        }}
        disabled={disabled}
      />
    </div>
  )
} 