"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

const candidateStatus = {
  total: 2651,
  applications: 69,
  shortlisted: 14,
  rejected: 7,
}

const recentApplications = [
  {
    name: "Bella Hamill",
    position: "Marketing Specialist",
    status: "OFFER",
    avatar: "/placeholder.svg",
  },
  {
    name: "Dashonte Clarke",
    position: "Project Manager",
    status: "SHORTLIST",
    avatar: "/placeholder.svg",
  },
  {
    name: "Julian Gruber",
    position: "Project Manager",
    status: "OFFER",
    avatar: "/placeholder.svg",
  },
]

const departments = [
  {
    name: "Development",
    members: 5,
    newMembers: 2,
    bgColor: "bg-purple-50",
  },
  {
    name: "Sales & Marketing",
    members: 4,
    bgColor: "bg-orange-50",
  },
  {
    name: "Project Management",
    members: 5,
    newMembers: 2,
    bgColor: "bg-green-50",
  },
  {
    name: "Analytics & Data",
    members: 4,
    newMembers: 2,
    bgColor: "bg-blue-50",
  },
  {
    name: "Finance",
    members: 3,
    bgColor: "bg-gray-50",
  },
]

const distributionData = [
  { name: "Development", value: 54, color: "#22C55E" },
  { name: "Sales & Marketing", value: 38, color: "#818CF8" },
  { name: "Project Management", value: 8, color: "#FB923C" },
]

const resourceData = [
  { name: "Week 1", insource: 48, outsource: 22 },
  { name: "Week 2", insource: 52, outsource: 18 },
  { name: "Week 3", insource: 58, outsource: 20 },
  { name: "Week 4", insource: 54, outsource: 22 },
  { name: "Week 5", insource: 48, outsource: 24 },
  { name: "Week 6", insource: 52, outsource: 18 },
]

const recentVacancies = [
  {
    title: "UX Designer",
    location: "Dayton",
    applicants: 122,
    newApplicants: 33,
    trend: [40, 60, 45, 65, 50, 70],
  },
  {
    title: "iOS App Developer",
    location: "Remote",
    applicants: 34,
    newApplicants: 5,
    trend: [30, 40, 35, 45, 40, 50],
  },
  {
    title: "Network Administrator",
    location: "Phoenix",
    applicants: 45,
    newApplicants: 13,
    trend: [50, 70, 55, 75, 60, 80],
  },
  {
    title: "JavaScript Developer",
    location: "Remote",
    applicants: 57,
    newApplicants: 5,
    trend: [45, 65, 50, 70, 55, 75],
  },
  {
    title: "Graphic Designer",
    location: "Gothenburg",
    applicants: 74,
    newApplicants: 22,
    trend: [35, 55, 40, 60, 45, 65],
  },
  {
    title: "Python Django Developer",
    location: "Remote",
    applicants: 44,
    newApplicants: 12,
    trend: [40, 60, 45, 65, 50, 70],
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Candidate Status */}
          <Card className="h-[300px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Candidate Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] overflow-y-auto hide-scrollbar">
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{candidateStatus.total}</span>
                    <span className="text-sm text-muted-foreground">EMPLOYERS</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
                    <div className="bg-blue-500" style={{ width: `${candidateStatus.applications}%` }} />
                    <div className="bg-green-500" style={{ width: `${candidateStatus.shortlisted}%` }} />
                    <div className="bg-orange-500" style={{ width: `${candidateStatus.rejected}%` }} />
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>{candidateStatus.applications}%</span>
                      </div>
                      <span className="text-xxs text-muted-foreground">TOTAL APPLICATIONS</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{candidateStatus.shortlisted}%</span>
                      </div>
                      <span className="text-xxs text-muted-foreground">SHORTLISTED</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <span>{candidateStatus.rejected}%</span>
                      </div>
                      <span className="text-xxs text-muted-foreground">REJECTED</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-3">Recent Applications</h3>
                  <div className="space-y-3">
                    {recentApplications.map((application) => (
                      <div key={application.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={application.avatar} alt={application.name} />
                            <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{application.name}</div>
                            <div className="text-sm text-muted-foreground">{application.position}</div>
                          </div>
                        </div>
                        <Badge 
                          variant={application.status === "OFFER" ? "success" : "secondary"}
                          className="uppercase"
                        >
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="h-[300px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Departments</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] overflow-y-auto hide-scrollbar">
              <div className="space-y-4">
                {departments.map((department) => (
                  <div 
                    key={department.name} 
                    className={`rounded-lg p-4 ${department.bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{department.name}</span>
                          {department.newMembers && (
                            <Badge variant="secondary" className="text-xs">
                              +{department.newMembers} new
                            </Badge>
                          )}
                        </div>
                        <div className="flex -space-x-2 overflow-hidden">
                          {Array.from({ length: department.members }).map((_, i) => (
                            <Avatar key={i} className="inline-block border-2 border-background">
                              <AvatarFallback>
                                {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribution by Departments */}
          <Card className="h-[300px] overflow-hidden bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Distribution by Departments</CardTitle>
              <Badge variant="outline">Sep. 01 - 07</Badge>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] overflow-y-auto hide-scrollbar">
              <div className="flex items-center gap-8">
                <div className="relative flex-1">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">3552</div>
                      <div className="text-xs text-muted-foreground">ALL EMPLOYEES</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {distributionData.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-16 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            {/* Recent Vacancies */}
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Vacancies</CardTitle>
              <Button variant="outline" size="sm">
                All Vacancies
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead>Job Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Applicants</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-[#F4F5F7]">
                  {recentVacancies.map((vacancy) => (
                    <TableRow key={vacancy.title}>
                      <TableCell className="font-medium">{vacancy.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {vacancy.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {vacancy.applicants}
                          {vacancy.newApplicants > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{vacancy.newApplicants} new
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-[24px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={vacancy.trend.map((value) => ({ value }))}>
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>View applicants</DropdownMenuItem>
                            <DropdownMenuItem>Edit vacancy</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Resource Collection */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Resource Collection</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                    <span className="text-xs">Insource</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-xs">Outsource</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={resourceData}>
                      <Line
                        type="monotone"
                        dataKey="insource"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="outsource"
                        stroke="#FB923C"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recently Activity */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Recently Activity</CardTitle>
                <Button variant="outline" size="sm">
                  All Activity
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="text-sm">
                        We welcomed Sophia Anderson to our team as a Network Administrator.
                      </div>
                      <div className="text-xs text-muted-foreground">11:20 AM, Mon 12 Sep 2023</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

