"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DatePicker } from "@/components/ui/date-picker"
import { SkillsInput } from "@/components/skills-input"

import { JobType, jobFormSchema, type JobFormData, transformFormToRequestSingle } from "./types"

interface JobCreationFormProps {
  organizationId: string
}

const jobTypes = Object.values(JobType.Values)
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR"]

export function JobCreationForm({ organizationId }: JobCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      skills: [],
      city: "",
      state: undefined,
      country: undefined,
      postalCode: undefined,
      jobType: "FULL_TIME",
      salaryMin: 0,
      salaryMax: 0,
      salaryCurrency: "USD",
      remote: false,
      status: "DRAFT",
      language: "en",
      summary: undefined,
      opening_date: undefined,
      closing_date: undefined,
      contact_person: undefined,
      contact_email: undefined,
      contact_phone: undefined,
      show_contact_info: false
    },
    mode: "onChange"
  })

  async function onSubmit(data: JobFormData) {
    try {
      setIsSubmitting(true)
      form.clearErrors()

      const jobData = transformFormToRequestSingle(data, organizationId)
      console.log("Submitting job data:", jobData)

      const response = await fetch("/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(jobData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `Failed to create job: ${response.status}`)
      }

      const job = await response.json()

      // Show success message
      toast.success("Job created successfully!")

      // Redirect to job details
      router.push(`/organizations/${organizationId}/jobs/${job.id}`)
    } catch (error) {
      console.error("Error creating job:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create job")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card className="col-span-1 p-6">
          <h2 className="text-lg font-semibold mb-6">Basic Information</h2>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter job title" {...field} />
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
                  <Textarea
                    placeholder="Enter job description"
                    className="resize-none"
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirements</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter job requirements (one per line)"
                    className="resize-none"
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter each requirement on a new line
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Skills</FormLabel>
                <FormControl>
                  <SkillsInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add required skills"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Additional Details */}
        <Card className="col-span-1 p-6">
          <h2 className="text-lg font-semibold mb-6">Additional Details</h2>

          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobTypes.map((type) => (
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="salaryMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Salary</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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
              name="salaryMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Salary</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="salaryCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
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
            name="remote"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel>Remote Work</FormLabel>
                  <FormDescription>
                    Is this a remote position?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="opening_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) => field.onChange(date?.toISOString())}
                      placeholder="Select opening date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closing_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closing Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) => field.onChange(date?.toISOString())}
                      placeholder="Select closing date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Location Information */}
        <Card className="col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-6">Location Information</h2>

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
              name="postalCode"
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

        {/* Contact Information */}
        <Card className="col-span-2 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <FormField
              control={form.control}
              name="show_contact_info"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel>Show Contact Info</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter contact email" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact phone" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Form Actions */}
        <div className="col-span-1 md:col-span-2 flex justify-end space-x-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 