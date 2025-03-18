"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { uploadImage } from "@/app/api/upload/client";

import {
  organizationCreationSchema,
  organizationIndustries,
  organizationCompanyTypes,
  organizationSizeRanges,
} from "./schema";

type FormValues = z.infer<typeof organizationCreationSchema>

export function OrganizationCreationForm() {
  const router = useRouter()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(organizationCreationSchema),
    defaultValues: {
      name: "",
      description: "",
      tier: "FREE",
      industry: undefined,
      company_type: undefined,
      founded_year: undefined,
      size_range: undefined,
      website_url: "",
      logo_url: undefined,
      cover_image_url: undefined,
      city: "",
      state: undefined,
      country: undefined,
      postal_code: undefined,
      verification_status: "PENDING",
      is_mock: false,
      mock_batch_id: null,
    },
    mode: "onChange"
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      form.clearErrors()
      
      // Upload images if they exist
      if (logoFile) {
        try {
          const { url } = await uploadImage(logoFile, 'organizations/logos')
          data.logo_url = url
        } catch (error) {
          console.error('Error uploading logo:', error)
          toast.error('Failed to upload logo. Please try again.')
          return
        }
      }

      if (coverFile) {
        try {
          const { url } = await uploadImage(coverFile, 'organizations/covers')
          data.cover_image_url = url
        } catch (error) {
          console.error('Error uploading cover image:', error)
          toast.error('Failed to upload cover image. Please try again.')
          return
        }
      }

      const response = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `Failed to create organization: ${response.status}`)
      }

      const organization = await response.json()

      // Show success message
      toast.success("Organization created successfully!")

      // Redirect to organization dashboard
      router.push(`/organizations/${organization.id}`)
    } catch (error) {
      console.error("Error creating organization:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create organization")
    } finally {
      setIsSubmitting(false)
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
                  <Input
                    placeholder="Enter organization name"
                    {...field}
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
                  <Input
                    placeholder="Enter organization description"
                    {...field}
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
                    currentImageUrl={logoFile ? URL.createObjectURL(logoFile) : field.value}
                    onImageSelect={(file) => {
                      setLogoFile(file)
                      field.onChange(undefined) // Clear the URL since we'll set it after upload
                    }}
                    aspectRatio="square"
                    height="sm"
                    maxSize={2}
                    description="Upload your organization logo"
                    showRemoveButton={!!logoFile || !!field.value}
                    onRemove={() => {
                      setLogoFile(null)
                      field.onChange(undefined)
                    }}
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
                    currentImageUrl={coverFile ? URL.createObjectURL(coverFile) : field.value}
                    onImageSelect={(file) => {
                      setCoverFile(file)
                      field.onChange(undefined) // Clear the URL since we'll set it after upload
                    }}
                    aspectRatio="wide"
                    height="sm"
                    maxSize={5}
                    description="Upload a cover image"
                    showRemoveButton={!!coverFile || !!field.value}
                    onRemove={() => {
                      setCoverFile(null)
                      field.onChange(undefined)
                    }}
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city (required)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter state/province" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter country" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter postal code" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Form Actions */}
        <div className="col-span-2 flex justify-end space-x-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 