"use client";;
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { PieChart, Pie, Cell, Label } from "recharts";
import { ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { PolarGrid, RadialBar, RadialBarChart } from "recharts";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
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
  },
  {
    action: "Sarah Chen updated the job description for Senior UX Designer role",
    time: "8:45 AM"
  },
  {
    action: "James Wilson approved 5 candidates for first round interviews",
    time: "8:30 AM"
  }
]

const applicantResources = {
  totalApplicants: 1000,
  jobBoards: 350,
  employeeReferrals: 200,
  socialMediaCampaigns: 300,
  recruitmentAgencies: 150
}

const resourcesChartData = [
  { name: "Job Boards", value: 350, fill: "hsl(142, 76%, 36%)" },
  { name: "Employee Referrals", value: 200, fill: "hsl(204, 86%, 53%)" },
  { name: "Social Media", value: 300, fill: "hsl(271, 91%, 65%)" },
  { name: "Agencies", value: 150, fill: "hsl(48, 96%, 53%)" }
]

export default function DashboardPage() {
  return (
    <div className="p-4">
      {/* Top Section */}
      <div className="grid grid-cols-4 gap-6">
        {/* Stats Cards - Single Row Spanning First Two Columns */}
        <div className="col-span-3">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-6">
              <StatCard 
                title="Applications" 
                count={statsData.applications.count} 
                change={statsData.applications.change} 
                trend={statsData.applications.trend}
                className="bg-[#ECFCCB]"
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
            <div className="grid grid-cols-2 gap-6">
               {/* Applications Chart - First Column Second Row */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Applications</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary/30" />
                    <span className="text-sm text-muted-foreground">Applied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">Shortlisted</span>
                  </div>
                </div>
              </div>
              <select className="text-sm border rounded-md px-2 py-1">
                <option>13-18 May</option>
              </select>
            </div>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicationData}>
                  <XAxis 
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Applied
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].value}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Shortlisted
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[1].value}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="applied"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary/30"
                  />
                  <Bar
                    dataKey="shortlisted"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Application by Department - Second Column Second Row */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Application by Department</h3>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">525</span> Total Applications
                </div>
              </div>
              <select className="text-sm border rounded-md px-2 py-1">
                <option>Today</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center justify-center">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        dataKey="value"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${index * 45}, 70%, 80%)`}
                            className="stroke-background hover:opacity-80"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-2">
                {departmentData.map((dept, index) => (
                  <div key={dept.department} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 45}, 70%, 80%)` }}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium">{dept.department}</span>
                      <span className="text-sm text-muted-foreground">{dept.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
          </div>
        </div>

        {/* Applicant Resources - Fourth Column */}
        <Card className="bg-blue-50 flex flex-col">
          <CardContent className="p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Applicant Resources</h3>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="aspect-square w-full max-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourcesChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={80}
                      outerRadius={100}
                      strokeWidth={1}
                      className="stroke-background"
                    >
                      {resourcesChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                        />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 10}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {applicantResources.totalApplicants}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 10}
                                  className="fill-foreground text-sm"
                                >
                                  Total Applicants
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: resourcesChartData[0].fill }} />
                    <div>
                      <div className="text-sm font-semibold">{applicantResources.jobBoards}</div>
                      <div className="text-xs text-muted-foreground">{resourcesChartData[0].name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: resourcesChartData[2].fill }} />
                    <div>
                      <div className="text-sm font-semibold">{applicantResources.socialMediaCampaigns}</div>
                      <div className="text-xs text-muted-foreground">{resourcesChartData[2].name}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: resourcesChartData[1].fill }} />
                    <div>
                      <div className="text-sm font-semibold">{applicantResources.employeeReferrals}</div>
                      <div className="text-xs text-muted-foreground">{resourcesChartData[1].name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: resourcesChartData[3].fill }} />
                    <div>
                      <div className="text-sm font-semibold">{applicantResources.recruitmentAgencies}</div>
                      <div className="text-xs text-muted-foreground">{resourcesChartData[3].name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

       
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-4 gap-6 mt-6">
        <div className="col-span-3">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-6">
              {/* Current Vacancies */}
              <Card className="col-span-3">
                <CardContent className="p-4">
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
           
              {/* Tasks */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Tasks</h3>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <TaskProgress
                        key={index}
                        progress={task.progress}
                        title={task.title}
                        type={task.type}
                        date={task.date}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card> 
            </div> 
          </div>
         
        </div>
       
          {/* Schedule */}
          <Card>
            <CardContent className="p-4">
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
      
      {/* Bottom Section */}
      <div className="grid grid-cols-4 gap-6 mt-6">
        <div className="col-span-3">
          <Card>
            <CardContent className="p-4">
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
        </div>
        
           {/* Recent Activity */}
          <Card>
            <CardContent className="p-4">
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
      
    </div>
  )
}

// Update StatCard component to accept className prop
interface StatCardProps {
  title: string
  count: number
  change: number
  trend: 'up' | 'down'
  className?: string
}

function StatCard({ title, count, change, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
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

// Add TaskProgress component before the StatCard component
interface TaskProgressProps {
  progress: number;
  title: string;
  type: string;
  date: string;
}

function TaskProgress({ progress, title, type, date }: TaskProgressProps) {
  const chartData = [{ value: progress, fill: "hsl(var(--primary))" }];
  const endAngle = (progress / 100) * 360;

  return (
    <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-md">
      <div className="relative w-12 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={chartData}
            startAngle={-50}
            endAngle={endAngle}
            innerRadius={20}
            outerRadius={28}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="rgba(139, 92, 246, 0.3)" strokeWidth={4}/>
            <RadialBar
              dataKey="value"
              background
              className="stroke-background [&.recharts-radial-bar-background-sector]:fill-[#8b5cf6]/30 [&.recharts-radial-bar-sector]:fill-[#8b5cf6]"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold">{progress}%</span>
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
          {title}
        </h4>
        <div className="gap-2">
          <span className="text-xs text-muted-foreground">{type} . {date}</span>
        </div>
      </div>
    </div>
  );
}

