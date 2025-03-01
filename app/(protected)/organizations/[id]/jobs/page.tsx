"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Search, Grid,
    List as ListIcon,
    Plus,
    Code,
    Users,
    BarChart4,
    DollarSign,
    Clock,
    MapPin,
    Briefcase
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";

// Mock data for jobs
const jobsData = [
  {
    id: "1",
    title: "Software Developer",
    department: "Engineering",
    level: "Mid-level",
    experience: "3-5 Years Experience",
    type: "Full-time",
    mode: "Remote",
    salary: "$80,000 - $100,000",
    applicants: 120,
    status: "Active",
    createdAt: "2023-05-15"
  },
  {
    id: "2",
    title: "HR Manager",
    department: "Human Resources",
    level: "Senior-level",
    experience: "8+ Years Experience",
    type: "Full-time",
    mode: "Hybrid",
    salary: "$90,000 - $110,000",
    applicants: 30,
    status: "Active",
    createdAt: "2023-05-10"
  },
  {
    id: "3",
    title: "Marketing Coordinator",
    department: "Marketing",
    level: "Entry-level",
    experience: "0-2 Years Experience",
    type: "Full-time",
    mode: "On-site",
    salary: "$45,000 - $60,000",
    applicants: 0,
    status: "Draft",
    createdAt: "2023-05-05"
  },
  {
    id: "4",
    title: "Financial Analyst",
    department: "Finance",
    level: "Mid-level",
    experience: "3-5 Years Experience",
    type: "Full-time",
    mode: "Remote",
    salary: "$70,000 - $85,000",
    applicants: 60,
    status: "Active",
    createdAt: "2023-04-28"
  },
  {
    id: "5",
    title: "Customer Support Specialist",
    department: "Customer Support",
    level: "Entry-level",
    experience: "0-1 Years Experience",
    type: "Part-time",
    mode: "Remote",
    salary: "$30,000 - $40,000",
    applicants: 50,
    status: "Active",
    createdAt: "2023-04-20"
  },
  {
    id: "6",
    title: "Operations Manager",
    department: "Operations",
    level: "Senior-level",
    experience: "10+ Years Experience",
    type: "Full-time",
    mode: "On-site",
    salary: "$95,000 - $120,000",
    applicants: 0,
    status: "Draft",
    createdAt: "2023-04-15"
  },
  {
    id: "7",
    title: "Data Scientist",
    department: "Research and Development",
    level: "Mid-level",
    experience: "4-6 Years Experience",
    type: "Full-time",
    mode: "Remote",
    salary: "$100,000 - $120,000",
    applicants: 40,
    status: "Active",
    createdAt: "2023-04-10"
  },
  {
    id: "8",
    title: "Content Writer",
    department: "Marketing",
    level: "Entry-level",
    experience: "1-3 Years Experience",
    type: "Contract",
    mode: "Remote",
    salary: "$35,000 - $45,000",
    applicants: 85,
    status: "Pending",
    createdAt: "2023-04-05"
  }
];

// Department icons mapping
const departmentIcons: Record<string, React.ReactNode> = {
  "Engineering": <Code className="h-6 w-6 text-blue-500" />,
  "Human Resources": <Users className="h-6 w-6 text-green-500" />,
  "Marketing": <BarChart4 className="h-6 w-6 text-purple-500" />,
  "Finance": <DollarSign className="h-6 w-6 text-yellow-500" />,
  "Customer Support": <Users className="h-6 w-6 text-blue-500" />,
  "Operations": <Briefcase className="h-6 w-6 text-green-500" />,
  "Research and Development": <Code className="h-6 w-6 text-purple-500" />
};

// Status badge variants
const getStatusVariant = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800";
    case "Draft":
      return "bg-gray-100 text-gray-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OrganizationJobsPage() {
  const params = useParams();
  const organizationId = params.id as string;
  
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  // Filter jobs based on search query
  const filteredJobs = jobsData.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort jobs based on selected option
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "applicants-high":
        return b.applicants - a.applicants;
      case "applicants-low":
        return a.applicants - b.applicants;
      default:
        return 0;
    }
  });
  
  // Pagination
  const jobsPerPage = 20;
  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage);
  const paginatedJobs = sortedJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s job listings
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href={`/organizations/${organizationId}/jobs/create`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search position, department, etc."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="applicants-high">Most Applicants</SelectItem>
              <SelectItem value="applicants-low">Least Applicants</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className={viewMode === "card" ? "bg-primary/10" : ""} onClick={() => setViewMode("card")}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className={viewMode === "list" ? "bg-primary/10" : ""} onClick={() => setViewMode("list")}>
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{sortedJobs.length}</span> Jobs
        </p>
      </div>

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedJobs.map((job) => (
            <Link href={`/organizations/${organizationId}/jobs/${job.id}`} key={job.id}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {departmentIcons[job.department] || <Briefcase className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.department}</p>
                      </div>
                    </div>
                    <Badge className={getStatusVariant(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{job.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{job.experience.split(" ")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{job.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">{job.salary}</div>
                    <div className="text-muted-foreground">{job.applicants} Applicants</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="mb-8">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/organizations/${organizationId}/jobs/${job.id}`} className="hover:text-primary">
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>{job.salary}</TableCell>
                    <TableCell>{job.applicants}</TableCell>
                    <TableCell>
                      <Badge className={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="justify-center"
        />
      )}
    </div>
  );
} 