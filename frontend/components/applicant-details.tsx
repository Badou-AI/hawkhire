import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ApplicantDetailsProps {
  applicant: {
    name: string
    position: string
    status: string
    email: string
    phone?: string
    linkedin?: string
    appliedDate: string
    education?: {
      degree: string
      university: string
      graduationDate: string
    }[]
    experience?: {
      title: string
      company: string
      location: string
      duration: string
      description: string[]
    }[]
    skills?: string[]
  }
  onClose?: () => void
}

export function ApplicantDetails({ applicant, onClose }: ApplicantDetailsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onClose?.()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="ghost" size="sm">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-100" />
              <div>
                <h2 className="text-2xl font-semibold font-libre-franklin">{applicant.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{applicant.position}</Badge>
                  {applicant.linkedin && (
                    <a href={applicant.linkedin} className="text-sm text-blue-600 hover:underline">
                      View LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">STATUS</span>
                <Select defaultValue={applicant.status}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Application</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer Extended</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground">Applied {applicant.appliedDate}</span>
            </div>
          </div>

          <div className="grid gap-8">
            <section>
              <h3 className="text-lg font-semibold mb-4 font-libre-franklin">Personal Details</h3>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">EMAIL</label>
                  <p className="mt-1">{applicant.email}</p>
                </div>
                {applicant.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PHONE</label>
                    <p className="mt-1">{applicant.phone}</p>
                  </div>
                )}
              </div>
            </section>

            {applicant.experience && (
              <section>
                <h3 className="text-lg font-semibold mb-4 font-libre-franklin">Professional Experience</h3>
                <div className="grid gap-6">
                  {applicant.experience.map((exp, index) => (
                    <div key={index} className="grid gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{exp.title}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {exp.location}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{exp.duration}</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {exp.description.map((desc, i) => (
                          <li key={i}>{desc}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {applicant.education && (
              <section>
                <h3 className="text-lg font-semibold mb-4 font-libre-franklin">Education Information</h3>
                <div className="grid gap-4">
                  {applicant.education.map((edu, index) => (
                    <div key={index}>
                      <div className="h-12 w-12 rounded bg-gray-100 mb-2" />
                      <h4 className="font-medium">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.university}</p>
                      <p className="text-sm text-muted-foreground">Graduated {edu.graduationDate}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {applicant.skills && (
              <section>
                <h3 className="text-lg font-semibold mb-4 font-libre-franklin">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {applicant.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

