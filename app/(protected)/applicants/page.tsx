"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Star } from 'lucide-react'
import { ApplicantDetails } from "@/components/applicant-details"
import Link from "next/link"

type Applicant = {
  name: string;
  position: string;
  status: string;
  email: string;
  date: string;
  appliedDate: string;  // Required
  phone?: string;       // Optional
  linkedin?: string;    // Optional
  education?: {
    degree: string;
    university: string;
    graduationDate: string;
  }[];
  experience?: {
    title: string;
    company: string;
    duration: string;
    location: string;
    description: string[];
  }[];
  skills?: string[];
  rating?: number;
}

const metrics = [
  {
    title: "Open Positions",
    value: "358",
    subtitle: "ALL VACANCIES",
    change: "+22 new",
    changeType: "positive",
  },
  {
    title: "Active Candidates",
    value: "125",
    subtitle: "ALL VACANCIES",
    change: "+15 new",
    changeType: "positive",
  },
  {
    title: "Hiring Process",
    value: "12",
    subtitle: "AVERAGE",
    unit: "HRS",
    change: "6 stages",
    changeType: "neutral",
  },
  {
    title: "Candidate Experience",
    value: "3+",
    subtitle: "AVERAGE",
    unit: "YRS",
    change: "+50%",
    changeType: "positive",
  },
]

const applicants: Applicant[] = [
  {
    name: "Jameson Steuber",
    position: "Full Stack Developer",
    date: "Sep, 10 2023",
    status: "New Application",
    email: "j.steuber@email.com",
    phone: "(123) 456-7890",
    linkedin: "linkedin.com/in/j.steuber",
    appliedDate: "Aug, 22 2023",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        university: "UNIVERSITY OF TECHNOLOGY",
        graduationDate: "May 2017",
      }
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "TECH INNOVATORS INC",
        location: "United States",
        duration: "Jan, 2023 - Present",
        description: [
          "Developed React.js components for improved user engagement",
          "Collaborated on RESTful APIs for seamless data exchange",
          "Optimized performance through efficient algorithms",
        ],
      },
      {
        title: "Full Stack Developer",
        company: "WEBSOLUTIONS LTD",
        location: "Sydney",
        duration: "Jul 2021 - Dec 2022",
        description: [
          "Led team in designing a client management system for efficiency",
          "Created custom WordPress themes and plugins for enhanced user experience",
        ],
      },
      {
        title: "Junior Software Developer",
        company: "CODECRAFTERS LLC",
        location: "Germany",
        duration: "Mar 2018 - Jun 2021",
        description: [
          "Assisted in developing a React Native mobile app with a high app store rating",
          "Participated in code reviews and adhered to best practices",
          "Gained experience with Git and JIRA",
        ],
      },
    ],
    skills: [
      "JavaScript",
      "Python",
      "HTML5",
      "CSS3",
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "MySQL",
      "Git",
      "Scrum",
      "VS Code, JIRA, Stack",
      "JIRA",
      "Stack",
    ],
    rating: 4,
  },
  {
    name: "Brendan Bradt",
    position: "UI/UX Designer",
    date: "Sep, 12 2023",
    status: "New Application",
    email: "b.bradtke@example.com",
    rating: 5,
    appliedDate: "Aug, 22 2023",
    phone: "(123) 456-7890",
    linkedin: "linkedin.com/in/b.bradtke",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        university: "UNIVERSITY OF TECHNOLOGY",
        graduationDate: "May 2017",
      }
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "TECH INNOVATORS INC",
        location: "United States",
        duration: "Jan, 2023 - Present",
        description: [
          "Developed React.js components for improved user engagement",
          "Collaborated on RESTful APIs for seamless data exchange",
          "Optimized performance through efficient algorithms",
        ],
      },
    ],
    skills: [
      "JavaScript",
      "Python",
      "HTML5",
      "CSS3",
      "React.js",
      "Node.js",
      "Express.js",
    ],
  },
  {
    name: "Jameson Steul",
    position: "Full Stack Developer",
    date: "Sep, 10 2023",
    status: "Interview 1",
    email: "steuber2012@example.com",
    rating: 4,
    appliedDate: "Aug, 22 2023",
    phone: "(123) 456-7890",
    linkedin: "linkedin.com/in/j.steuber",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        university: "UNIVERSITY OF TECHNOLOGY",
        graduationDate: "May 2017",
      }
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "TECH INNOVATORS INC",
        location: "United States",
        duration: "Jan, 2023 - Present",
        description: [
          "Developed React.js components for improved user engagement",
          "Collaborated on RESTful APIs for seamless data exchange",
          "Optimized performance through efficient algorithms",
        ],
      },
    ],
    skills: [
      "JavaScript",
      "Python",
      "HTML5",
      "CSS3",
      "React.js",
      "Node.js",
      "Express.js",
    ],
  },
  {
    name: "Ellen Howell",
    position: "UI/UX Designer",
    date: "Sep, 3 2023",
    status: "Review",
    email: "ellen4452@example.com",
    rating: 3,
    appliedDate: "Aug, 22 2023",
    phone: "(123) 456-7890",
    linkedin: "linkedin.com/in/b.bradtke",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        university: "UNIVERSITY OF TECHNOLOGY",
        graduationDate: "May 2017",
      }
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "TECH INNOVATORS INC",
        location: "United States",
        duration: "Jan, 2023 - Present",
        description: [
          "Developed React.js components for improved user engagement",
          "Collaborated on RESTful APIs for seamless data exchange",
          "Optimized performance through efficient algorithms",
        ],
      },
    ],
  },
  {
    name: "Krystina Kautz",
    position: "Data Analyst",
    date: "Sep, 1 2023",
    status: "Onboarding",
    email: "krkautz@example.com",
    rating: 5,
    appliedDate: "Aug, 22 2023",
    phone: "(123) 456-7890",
    linkedin: "linkedin.com/in/b.bradtke",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        university: "UNIVERSITY OF TECHNOLOGY",
        graduationDate: "May 2017",
      }
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "TECH INNOVATORS INC",
        location: "United States",
        duration: "Jan, 2023 - Present",
        description: [
          "Developed React.js components for improved user engagement",
          "Collaborated on RESTful APIs for seamless data exchange",
          "Optimized performance through efficient algorithms",
        ],
      },
    ],
    skills: [
      "JavaScript",
      "Python",
      "HTML5",
      "CSS3",
      "React.js",
      "Node.js",
      "Express.js",
    ],
  },
  {
    name: "Colt Lakin",
    position: "Frontend Developer",
    date: "Aug, 28 2023",
    status: "Offer Extended",
    email: "coltlakin@example.com",
    rating: 5,
    appliedDate: "Aug, 22 2023",
    phone: "(123) 456-7890",
    linkedin: "linkedin.com/in/b.bradtke",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        university: "UNIVERSITY OF TECHNOLOGY",
        graduationDate: "May 2017",
      }
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "TECH INNOVATORS INC",
        location: "United States",
        duration: "Jan, 2023 - Present",
        description: [
          "Developed React.js components for improved user engagement",
          "Collaborated on RESTful APIs for seamless data exchange",
          "Optimized performance through efficient algorithms",
        ],
      },
    ],
    skills: [
      "JavaScript",
      "Python",
      "HTML5",
      "CSS3",
      "React.js",
      "Node.js",
      "Express.js",
    ],
  },
]

export default function ApplicantsPage() {
  const [selectedApplicant, setSelectedApplicant] = useState<typeof applicants[0] | null>(null)

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Applicants</h1>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" size="sm">Sort by</Button>
            <Button variant="outline" size="sm">Designation</Button>
            <Button size="sm">+ Add Applicant</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {metric.subtitle}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value}
                  {metric.unit && <span className="text-xl ml-1">{metric.unit}</span>}
                </div>
                <div className="mt-4 h-[60px]">
                  <div className="flex gap-1 h-full items-end">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-violet-500' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-green-500'
                        } rounded`}
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
                <Badge
                  className={`mt-2 ${
                    metric.changeType === "positive"
                      ? "bg-green-100 text-green-800"
                      : metric.changeType === "negative"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {metric.change}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Position Applied</TableHead>
                  <TableHead>Application Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow 
                    key={applicant.email}
                    className="cursor-pointer"
                    onClick={() => setSelectedApplicant(applicant)}
                  >
                    <TableCell className="font-medium">{applicant.name}</TableCell>
                    <TableCell>
                      <Link href={`/positions/${applicant.position.toLowerCase().replaceAll(' ', '-')}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary">
                          {applicant.position}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell>{applicant.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{applicant.status}</Badge>
                    </TableCell>
                    <TableCell>{applicant.email}</TableCell>
                    <TableCell>
                      {typeof applicant.rating === 'number' && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < applicant.rating!
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-200 fill-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedApplicant(applicant)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={selectedApplicant !== null} onOpenChange={() => setSelectedApplicant(null)}>
        <SheetContent className="w-full sm:max-w-[50%] p-0 border-l">
          {selectedApplicant && (
            <ApplicantDetails 
              applicant={selectedApplicant}
              onClose={() => setSelectedApplicant(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

