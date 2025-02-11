"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    MoreHorizontal,
    TrendingUp,
    TrendingDown
} from 'lucide-react'
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip
} from "recharts"
import { Progress } from "@/components/ui/progress"

interface StatsDataItem {
  count: number
  change: number
  trend: 'up' | 'down'
}

interface StatsData {
  applications: StatsDataItem
  shortlisted: StatsDataItem
  hired: StatsDataItem
  rejected: StatsDataItem
}

// Hardcoded data
const statsData: StatsData = {
  applications: { count: 1534, change: 12.67, trend: 'up' },
  shortlisted: { count: 869, change: 1.98, trend: 'down' },
  hired: { count: 236, change: 8.35, trend: 'up' },
  rejected: { count: 429, change: 2.85, trend: 'down' }
}

const applicationData = [
  { date: "13 May", applied: 300, shortlisted: 100 },
  { date: "14 May", applied: 350, shortlisted: 150 },
  { date: "15 May", applied: 280, shortlisted: 90 },
  { date: "16 May", applied: 320, shortlisted: 110 },
  { date: "17 May", applied: 290, shortlisted: 80 },
  { date: "18 May", applied: 350, shortlisted: 140 }
]

const departmentData = [
  { department: "Engineering", value: 120 },
  { department: "Marketing", value: 110 },
  { department: "Sales", value: 95 },
  { department: "Customer Support", value: 85 },
  { department: "Finance", value: 65 },
  { department: "Human Resources", value: 50 }
]

const currentVacancies = [
  {
    role: "Software Developer",
    type: "Full-time",
    mode: "Remote",
    salary: "$70K - $90K",
    applicants: 120
  },
  {
    role: "Graphic Designer",
    type: "Part-time",
    mode: "Hybrid",
    salary: "$40K - $55K",
    applicants: 75
  },
  {
    role: "Sales Manager",
    type: "Full-time",
    mode: "On-site",
    salary: "$65K - $80K",
    applicants: 75
  },
  {
    role: "HR Coordinator",
    type: "Contract",
    mode: "Remote",
    salary: "$50K - $60K",
    applicants: 60
  }
]

const tasks = [
  {
    title: "Resume Screening",
    type: "Evaluation",
    date: "May 27, 2027",
    progress: 25
  },
  {
    title: "Interview Scheduling",
    type: "Engagement",
    date: "May 25, 2027",
    progress: 50
  },
  {
    title: "Candidate Communication",
    type: "Relationship",
    date: "May 25, 2027",
    progress: 75
  },
  {
    title: "Offer Management",
    type: "Selection",
    date: "May 25, 2027",
    progress: 90
  }
]

const schedule = [
  {
    time: "1:00 PM",
    title: "Marketing Strategy Presentation",
    department: "Marketing"
  },
  {
    time: "2:30 PM",
    title: "HR Policy Update Session",
    department: "Human Resources"
  },
  {
    time: "4:00 PM",
    title: "Customer Feedback Analysis",
    department: "Customer Support"
  },
  {
    time: "5:30 PM",
    title: "Financial Reporting Session",
    department: "Finance"
  }
]

const applicants = [
  {
    name: "Alex Boide",
    email: "a.boide@hirezy.com",
    role: "Software Engineer",
    date: "Apr 15, 2027",
    type: "Full-time",
    status: "Interviewing"
  },
  {
    name: "Alice Johnson",
    email: "a.johnson@hirezy.com",
    role: "HR Specialist",
    date: "Apr 10, 2027",
    type: "Contract",
    status: "Shortlisted"
  },
  {
    name: "Bob Lee",
    email: "b.lee@hirezy.com",
    role: "Sales Associate",
    date: "Apr 18, 2027",
    type: "Temporary",
    status: "Screening"
  },
  {
    name: "Mark Brown",
    email: "m.brown@hirezy.com",
    role: "Financial Analyst",
    date: "Apr 22, 2027",
    type: "Full-time",
    status: "Job Offer"
  },
  {
    name: "Sandra Maxine",
    email: "s.maxine@hirezy.com",
    role: "Marketing Manager",
    date: "Apr 20, 2027",
    type: "Part-time",
    status: "Shortlisted"
  }
]

const recentActivity = [
  {
    action: "Darren Wright viewed 15 candidate profiles for the Software Developer position",
    time: "10:15 AM"
  },
  {
    action: "Caren Smith scheduled interviews with 3 candidates for the Marketing Manager role",
    time: "9:25 AM"
  },
  {
    action: "Automated Reminder sent to Bob Lee to complete interview feedback",
    time: "9:00 AM"
  }
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Applications" 
          count={statsData.applications.count} 
          change={statsData.applications.change} 
          trend={statsData.applications.trend}
        />
        <StatCard 
          title="Shortlisted" 
          count={statsData.shortlisted.count} 
          change={statsData.shortlisted.change} 
          trend={statsData.shortlisted.trend}
        />
        <StatCard 
          title="Hired" 
          count={statsData.hired.count} 
          change={statsData.hired.change} 
          trend={statsData.hired.trend}
        />
        <StatCard 
          title="Rejected" 
          count={statsData.rejected.count} 
          change={statsData.rejected.change} 
          trend={statsData.rejected.trend}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Applications</h3>
              <select className="text-sm border rounded-md px-2 py-1">
                <option>13-18 May</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applied" fill="#E2E8F0" />
                <Bar dataKey="shortlisted" fill="#94A3B8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Application by Department</h3>
              <select className="text-sm border rounded-md px-2 py-1">
                <option>Today</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    dataKey="value"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 80%)`} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {departmentData.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between">
                    <span className="text-sm">{dept.department}</span>
                    <span className="text-sm font-medium">{dept.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Vacancies */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Current Vacancies</h3>
            <div className="flex items-center gap-2">
              <select className="text-sm border rounded-md px-2 py-1">
                <option>Popular</option>
              </select>
              <Button variant="link" className="text-sm">See All</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {currentVacancies.map((vacancy, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{vacancy.role}</h4>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                  <span>{vacancy.type}</span>
                  <span>•</span>
                  <span>{vacancy.mode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{vacancy.salary}</span>
                  <span>{vacancy.applicants} Applicants</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks and Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Tasks</h3>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Progress value={task.progress} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{task.type}</span>
                      <span>•</span>
                      <span>{task.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Schedule</h3>
              <select className="text-sm border rounded-md px-2 py-1">
                <option>Today</option>
              </select>
            </div>
            <div className="space-y-4">
              {schedule.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="text-sm text-muted-foreground w-16">
                    {event.time}
                  </div>
                  <div className="flex-1 bg-secondary/20 rounded-lg p-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applicants List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Applicants List</h3>
              <Badge variant="secondary">1,242</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">All Applicants</Button>
              <Button variant="ghost" size="sm">Screening</Button>
              <Button variant="ghost" size="sm">Shortlisted</Button>
              <Button variant="ghost" size="sm">Interviewing</Button>
              <Button variant="ghost" size="sm">Job Offer</Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Employment Type</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((applicant, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{applicant.name}</div>
                      <div className="text-sm text-muted-foreground">{applicant.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{applicant.role}</TableCell>
                  <TableCell>{applicant.date}</TableCell>
                  <TableCell>{applicant.type}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View Resume</Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      applicant.status === "Job Offer" ? "default" :
                      applicant.status === "Interviewing" ? "secondary" :
                      "secondary"
                    }>
                      {applicant.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <Avatar className="mt-1">
                  <AvatarFallback>
                    {activity.action.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// StatCard component
interface StatCardProps {
  title: string
  count: number
  change: number
  trend: 'up' | 'down'
}

function StatCard({ title, count, change, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{count}</h3>
          <Badge variant={trend === "up" ? "default" : "destructive"} className="flex items-center gap-1">
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

