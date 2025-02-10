"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { jobFormSchema, type JobFormData, transformFormToRequest } from "./types"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface JobCreationFormProps {
  organizationId: string
}

export function JobCreationForm({ organizationId }: JobCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      remote: false,
      skills: [],
      status: "DRAFT",
      show_contact_info: false
    }
  })

  const onSubmit = async (data: JobFormData) => {
    try {
      setIsSubmitting(true)
      const jobData = transformFormToRequest(data, organizationId)

      const response = await fetch(`/api/v1/organizations/${organizationId}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create job')
      }

      const job = await response.json()
      toast.success('Job created successfully')
      router.push(`/jobs/${job.id}`)
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information Section */}
            <Card className="shadow-none border-none">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <p className="text-sm text-muted-foreground">
                  Core details about the position
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Software Engineer" {...field} />
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
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the role and responsibilities..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="FULL_TIME" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Full Time
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="PART_TIME" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Part Time
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="CONTRACT" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Contract
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="INTERNSHIP" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Internship
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="remote"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Remote Position</FormLabel>
                        <FormDescription>
                          Check if this position can be performed remotely
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Dates and Status Section */}
            <Card className="shadow-none border-none">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Important Dates</h2>
                <p className="text-sm text-muted-foreground">
                  Set the vacancy timeline
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="opening_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Opening Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date?.toISOString())}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closing_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Closing Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date?.toISOString())}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Requirements Section */}
            <Card className="shadow-none border-none">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Requirements</h2>
                <p className="text-sm text-muted-foreground">
                  Qualifications and skills needed for the role
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter requirements (one per line)..."
                          className="min-h-[150px]"
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
                        <Textarea
                          placeholder="Enter skills (one per line)..."
                          className="min-h-[150px]"
                          value={field.value?.join("\n") || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                .split("\n")
                                .map((line) => line.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each skill on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Compensation Section */}
            <Card className="shadow-none border-none">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Compensation</h2>
                <p className="text-sm text-muted-foreground">
                  Salary and benefits information
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. USD" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>

            {/* Contact Information Section */}
            <Card className="shadow-none border-none">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Contact Information</h2>
                <p className="text-sm text-muted-foreground">
                  Details for applicant inquiries
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
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
                        <Input placeholder="Phone number" {...field} />
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
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="show_contact_info"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Show Contact Information</FormLabel>
                        <FormDescription>
                          Display contact information publicly on the job posting
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end space-x-4 p-6 bg-background border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 