"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LocalizedTextInput } from "@/components/localized-text-input"
import { LocalizedLocationInput } from "@/components/localized-location-input"
import { ImageUpload } from "@/components/image-upload"
import { uploadImage } from "@/app/api/upload/client"
import { toast } from "sonner"

import {
    organizationCreationSchema,
    organizationIndustries,
    organizationCompanyTypes,
    organizationSizeRanges,
} from "./schema"

type FormValues = z.infer<typeof organizationCreationSchema>

const defaultLocalizedText = { en: "", fr: "" }
const defaultLocalizedLocation = {
  city: defaultLocalizedText,
  state: defaultLocalizedText,
  country: defaultLocalizedText,
  postal_code: defaultLocalizedText,
}

export function OrganizationCreationForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(organizationCreationSchema),
    defaultValues: {
      name: defaultLocalizedText,
      description: defaultLocalizedText,
      tier: "FREE",
      industry: undefined,
      company_type: undefined,
      founded_year: undefined,
      size_range: undefined,
      website_url: "",
      logo_url: "/placeholders/organization-logo.png",
      cover_image_url: "/placeholders/organization-cover.png",
      primary_location: defaultLocalizedLocation,
      additional_locations: [],
      languages: ["en"],
      verification_status: "PENDING",
      is_mock: false,
      mock_batch_id: null,
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      const response = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create organization")
      }

      // Handle success (redirect, show message, etc.)
    } catch (error) {
      // Handle error
      console.error("Error creating organization:", error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card className="col-span-1 space-y-6 p-6">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <LocalizedTextInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={{
                      en: "Enter organization name in English",
                      fr: "Enter organization name in French (optional)",
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <LocalizedTextInput
                    value={field.value}
                    onChange={field.onChange}
                    multiline
                    placeholder={{
                      en: "Enter organization description in English",
                      fr: "Enter organization description in French (optional)",
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organizationIndustries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organizationCompanyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Additional Details */}
        <Card className="col-span-1 space-y-6 p-6">
          <h2 className="text-lg font-semibold">Additional Details</h2>

          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Logo</FormLabel>
                <FormControl>
                  <ImageUpload
                    currentImageUrl={field.value}
                    onImageSelect={async (file) => {
                      try {
                        const { url } = await uploadImage(file, 'logos')
                        field.onChange(url)
                      } catch (error) {
                        console.error('Error uploading logo:', error)
                        toast.error('Failed to upload logo. Please try again.')
                      }
                    }}
                    aspectRatio="square"
                    height="sm"
                    maxSize={2}
                    description="Upload your organization logo"
                    showRemoveButton
                    onRemove={() => field.onChange("/placeholders/organization-logo.png")}
                  />
                </FormControl>
                <FormDescription>
                  Recommended size: 256x256 pixels
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cover_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    currentImageUrl={field.value}
                    onImageSelect={async (file) => {
                      try {
                        const { url } = await uploadImage(file, 'covers')
                        field.onChange(url)
                      } catch (error) {
                        console.error('Error uploading cover image:', error)
                        toast.error('Failed to upload cover image. Please try again.')
                      }
                    }}
                    aspectRatio="wide"
                    height="sm"
                    maxSize={5}
                    description="Upload a cover image"
                    showRemoveButton
                    onRemove={() => field.onChange("/placeholders/organization-cover.png")}
                  />
                </FormControl>
                <FormDescription>
                  Recommended size: 1200x400 pixels
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="founded_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Founded Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Size</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organizationSizeRanges.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Location Information */}
        <Card className="col-span-2 space-y-6 p-6">
          <h2 className="text-lg font-semibold">Location Information</h2>

          <FormField
            control={form.control}
            name="primary_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Location</FormLabel>
                <FormControl>
                  <LocalizedLocationInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Form Actions */}
        <div className="col-span-2 flex justify-end space-x-4 border-t pt-6">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">Create Organization</Button>
        </div>
      </form>
    </Form>
  )
} 