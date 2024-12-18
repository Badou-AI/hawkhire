"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Edit3 } from 'lucide-react'
import Link from "next/link"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const jobData = {
  title: "Senior Frontend Developer",
  metrics: {
    views: { value: 569, change: 12 },
    applications: { value: 124, change: 12 },
    shortlisted: { value: 32, change: 12 },
    awaitingReview: { value: 92, change: 12 },
  },
  applicationHistory: [
    { date: "Aug 24", value: 15 },
    { date: "Aug 25", value: 38 },
    { date: "Aug 26", value: 25 },
    { date: "Aug 27", value: 35 },
    { date: "Aug 28", value: 21 },
    { date: "Aug 29", value: 28 },
  ],
  experienceDistribution: [
    { name: "< 1 year", value: 24, color: "#FFB547" },
    { name: "1-3 years", value: 55, color: "#3B82F6" },
    { name: "3+ years", value: 45, color: "#8B5CF6" },
  ],
  details: {
    status: "Active",
    openingDate: "Aug, 22 2023",
    closingDate: "Aug, 22 2023",
    salary: "$80,000 - $120,000",
    skills: "React, TypeScript, Next.js, GraphQL, REST APIs",
    description: "We are seeking an experienced Senior Frontend Developer to join our team. You will be responsible for designing, developing, and maintaining high-quality web applications using modern frontend technologies.",
    notes: "Looking for candidates with strong problem-solving skills and experience in large-scale applications.",
  },
  recentActivity: [
    {
      type: "feedback",
      title: "Interview Feedback",
      description: "Positive feedback received for David Clark's interview.",
      color: "bg-violet-500",
    },
    {
      type: "withdrawn",
      title: "Application Withdrawn",
      description: "Lisa Williams withdrew her application.",
      color: "bg-green-500",
    },
    {
      type: "scheduled",
      title: "Interview Scheduled",
      description: "Emily Johnson's interview scheduled for August 25.",
      color: "bg-violet-500",
    },
    {
      type: "offer",
      title: "Offer Extended",
      description: "Offer extended to Sarah Miller.",
      color: "bg-green-500",
    },
    {
      type: "received",
      title: "Application Received",
      description: "John Smith submitted an application.",
      color: "bg-orange-500",
    },
  ],
}

export default function JobPositionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/applicants">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{jobData.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Applicants</Button>
          <Button>Job Detail</Button>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-12">
        <Card className="lg:col-span-4 p-4">
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">VACANCY VIEWS</div>
              <div className="flex">
              <div className="text-2xl font-bold flex-1">{jobData.metrics.views.value}</div>
              <Badge className="mt-1 bg-green-100 text-green-700 text-xs font-medium">
                ↑ {jobData.metrics.views.change}%
              </Badge>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">TOTAL APPLICATIONS</div>
              <div className="flex">
              <div className="text-2xl font-bold flex-1">{jobData.metrics.applications.value}</div>
              <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs font-medium">
                ↑ {jobData.metrics.applications.change}%
              </Badge>
              </div>
            </div>
            <div className="bg-violet-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">SHORTLISTED</div>
              <div className="flex">
              <div className="text-2xl font-bold flex-1">{jobData.metrics.shortlisted.value}</div>
              <Badge className="mt-1 bg-violet-100 text-violet-700 text-xs font-medium">
                ↑ {jobData.metrics.shortlisted.change}%
              </Badge>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">AWAITING REVIEW</div>
              <div className="flex">
              <div className="text-2xl font-bold flex-1">{jobData.metrics.awaitingReview.value}</div>
              <Badge className="mt-1 bg-orange-100 text-orange-700 text-xs font-medium">
                ↑ {jobData.metrics.awaitingReview.change}%
              </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5 p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Applications Over Time</h2>
            <select className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <option>Nov. 01 - 07</option>
            </select>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={jobData.applicationHistory}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9F43" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF9F43" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  domain={[0, 'dataMax + 10']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FF9F43"
                  strokeWidth={2}
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-4">
          <h2 className="text-lg font-semibold mb-4">Experience Distribution</h2>
          <div className="flex flex-row items-center">
            <div className="relative h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobData.experienceDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {jobData.experienceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">124</div>
                <div className="text-xs text-gray-500">Candidates</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {jobData.experienceDistribution.map((item, index) => (
                <div key={index} className="block">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-9 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Job Description</h2>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Vacancy
            </Button>
          </div>
          <div className="space-y-6">
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">JOB TITLE</div>
              <div className="text-sm">{jobData.title}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">JOB STATUS</div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {jobData.details.status}
              </div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">OPENING - CLOSING DATES</div>
              <div className="flex items-center gap-2 text-sm">
                <span>{jobData.details.openingDate}</span>
                <span>-</span>
                <span>{jobData.details.closingDate}</span>
              </div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">SALARY</div>
              <div className="text-sm">{jobData.details.salary}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">KEY SKILLS AND EXPERIENCE</div>
              <div className="text-sm">{jobData.details.skills}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">JOB DESCRIPTION</div>
              <div className="text-sm">{jobData.details.description}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-gray-500">NOTES</div>
              <div className="text-sm">{jobData.details.notes}</div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {jobData.recentActivity.map((activity, index) => (
              <div key={index} className="flex gap-4">
                <div className={`w-2 h-2 mt-2 rounded-full ${activity.color}`} />
                <div>
                  <div className="text-sm font-medium">{activity.title}</div>
                  <div className="text-xs text-gray-500">
                    {activity.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

