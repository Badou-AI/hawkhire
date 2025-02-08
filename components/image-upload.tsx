"use client"

import { useState } from "react"
import { Upload, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  currentImageUrl?: string
  disabled?: boolean
  maxSize?: number // in MB
  acceptedTypes?: string[]
  description?: string
  fileTypeDescription?: string
  className?: string
  aspectRatio?: "square" | "wide" // For different image layouts
  showRemoveButton?: boolean
  onRemove?: () => void
}

export function ImageUpload({
  onImageSelect,
  currentImageUrl,
  disabled = false,
  maxSize = 5, // Default to 5MB for images
  acceptedTypes = [".jpg", ".jpeg", ".png", ".gif"],
  description = "Drag and drop your image here",
  fileTypeDescription = "JPG, PNG or GIF",
  className,
  aspectRatio = "square",
  showRemoveButton = false,
  onRemove,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleImageSelect = (file: File) => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      console.error(`Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`)
      return
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      console.error(`File size exceeds ${maxSize}MB limit`)
      return
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    onImageSelect(file)

    // Clean up the preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    handleImageSelect(file)
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onRemove?.()
  }

  const containerClasses = cn(
    "relative rounded-lg overflow-hidden",
    aspectRatio === "square" ? "aspect-square" : "aspect-video",
    className
  )

  const dropzoneClasses = cn(
    "w-full h-full border-2 border-dashed rounded-lg",
    "transition-colors duration-200",
    isDragging ? "border-primary bg-primary/5" : "border-muted",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/50",
  )

  if (previewUrl) {
    return (
      <div className={containerClasses}>
        <Image
          src={previewUrl}
          alt="Preview"
          fill
          className="object-cover"
        />
        {showRemoveButton && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={containerClasses}
      onDrop={disabled ? undefined : handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => {
        if (!disabled) {
          const input = document.getElementById("image-upload") as HTMLInputElement
          if (input) {
            input.click()
          }
        }
      }}
    >
      <div className={dropzoneClasses}>
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-4">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">{description}</p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{fileTypeDescription}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Max size: {maxSize}MB</span>
            </div>
          </div>
        </div>

        <input
          id="image-upload"
          type="file"
          accept={acceptedTypes.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleImageSelect(file)
              // Reset the input value to allow selecting the same file again
              e.target.value = ""
            }
          }}
          disabled={disabled}
        />
      </div>
    </div>
  )
} 