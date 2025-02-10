"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BulkCreateDialogProps {
  organizationId: string
}

export function BulkCreateDialog({ organizationId }: BulkCreateDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/json") {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      const content = await file.text()
      const jobs = JSON.parse(content)

      const response = await fetch("/api/jobs/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: organizationId,
          jobs
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create jobs")
      }

      const result = await response.json()
      console.log("Bulk creation result:", result)
      // TODO: Show success message and handle response
    } catch (error) {
      console.error("Error uploading jobs:", error)
      // TODO: Show error message
    } finally {
      setIsUploading(false)
      setFile(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Create Jobs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Create Jobs</DialogTitle>
          <DialogDescription>
            Upload a JSON file containing multiple job postings. The file should contain an array of job objects following the required schema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="jobs-file">Jobs File</Label>
            <Input
              id="jobs-file"
              type="file"
              accept="application/json"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              Only JSON files are supported
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload and Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 