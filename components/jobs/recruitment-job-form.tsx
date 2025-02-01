'use client'

import { useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function RecruitmentJobForm() {
  const form = useForm()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Client Company Info */}
        <div className="space-y-2">
          <Label>Client Company</Label>
          <Input
            placeholder="Search client companies..."
          />
          <p className="text-sm text-muted-foreground">
            Private listing for specific client
          </p>
        </div>

        {/* Position Details */}
        <div className="space-y-2">
          <Label>Position Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select position type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct_hire">Direct Hire</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="temp_to_perm">Temp-to-Perm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Specialized Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Candidate Requirements</Label>
          <Textarea
            className="min-h-[120px]"
            placeholder="List specific candidate requirements..."
          />
        </div>

        <div className="space-y-2">
          <Label>Client Interview Process</Label>
          <Textarea
            className="min-h-[100px]"
            placeholder="Describe the client's interview stages..."
          />
        </div>
      </div>
    </div>
  )
} 