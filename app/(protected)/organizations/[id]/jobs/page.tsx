"use client";

import { useState, useEffect } from "react";
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
    Briefcase,
    Loader2
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
import { createClient } from "@/lib/supabase/client";

// Job interface based on database schema
interface Job {
  id: string;
  title: string;
  department: string;
  level: string;
  experience: string;
  type: string;
  mode: string;
  salary: string;
  applicants: number;
  status: string;
  createdAt: string;
}

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
    case "PUBLISHED":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "CLOSED":
      return "bg-red-100 text-red-800";
    case "ARCHIVED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Format job type for display
const formatJobType = (type: string) => {
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Format salary for display
const formatSalary = (min?: number, max?: number, currency?: string) => {
  if (!min || !max) return "Competitive";
  return `$${min/1000}k - $${max/1000}k ${currency || 'USD'}`;
};

export default function OrganizationJobsPage() {
  const params = useParams();
  const organizationId = params.id as string;
  
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch jobs for the organization
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Fetch jobs for the specific organization
        const { data, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            job_type,
            status,
            remote,
            salary_min,
            salary_max,
            salary_currency,
            created_at,
            skills,
            requirements,
            organizations (
              id,
              name,
              industry
            ),
            resumes (count)
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });
        
        if (jobsError) {
          throw jobsError;
        }
        
        // Transform the data to match our Job interface
        const transformedJobs = data.map(job => {
          // Determine job level and experience based on salary range
          let level = "Entry-level";
          let experience = "0-1 Years Experience";
          
          if (job.salary_min && job.salary_min >= 80000) {
            level = "Senior-level";
            experience = "5+ Years Experience";
          } else if (job.salary_min && job.salary_min >= 60000) {
            level = "Mid-level";
            experience = "3-5 Years Experience";
          } else if (job.salary_min && job.salary_min >= 40000) {
            level = "Entry-level";
            experience = "1-3 Years Experience";
          }
          
          // Determine work mode based on remote status
          const mode = job.remote ? "Remote" : "On-site";
          
          // Extract department from organization industry or default to a category
          const department = job.organizations?.industry || "General";
          
          // Format the job title - handle localized titles
          let title = "";
          if (typeof job.title === 'string') {
            title = job.title;
          } else if (typeof job.title === 'object') {
            title = job.title.en || Object.values(job.title)[0] || "Untitled Position";
          }
          
          return {
            id: job.id,
            title: title,
            department: department,
            level: level,
            experience: experience,
            type: formatJobType(job.job_type),
            mode: mode,
            salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
            applicants: job.resumes?.[0]?.count || 0,
            status: job.status,
            createdAt: job.created_at
          };
        });
        
        setJobs(transformedJobs);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, [organizationId]);
  
  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => 
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading jobs...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-6">
            Your organization doesn&apos;t have any jobs posted yet.
          </p>
          <Link href={`/organizations/${organizationId}/jobs/create`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Job
            </Button>
          </Link>
        </div>
      )}

      {/* Card View */}
      {!loading && !error && viewMode === "card" && jobs.length > 0 && (
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
                      {job.status === "PUBLISHED" ? "Active" : 
                       job.status === "DRAFT" ? "Draft" : 
                       job.status === "CLOSED" ? "Closed" : 
                       job.status === "ARCHIVED" ? "Archived" : job.status}
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
      {!loading && !error && viewMode === "list" && jobs.length > 0 && (
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
                        {job.status === "PUBLISHED" ? "Active" : 
                         job.status === "DRAFT" ? "Draft" : 
                         job.status === "CLOSED" ? "Closed" : 
                         job.status === "ARCHIVED" ? "Archived" : job.status}
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
      {!loading && !error && totalPages > 1 && (
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