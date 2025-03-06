"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Share2,
  Bookmark,
  Building,
  Calendar,
  CheckCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { JobDescription } from '@/components/jobs/job-description';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  department: string;
  level: string;
  experience: string;
  type: string;
  mode: string;
  salary: string;
  location: string;
  applicants: number;
  status: string;
  createdAt: string;
  summary: string;
  organization: {
    id: string;
    name: string;
    industry: string;
    size: string;
    size_range?: string;
    logo?: string;
  };
  processed?: {
    total_applicants: number;
    average_match_score?: number;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    last_processed_at: string;
    top_skills?: Array<{
      skill: string;
      count: number;
      average_score: number;
    }>;
  };
}

// Helper function to safely extract text from potentially localized objects
const getLocalizedText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object') {
    // Try to extract English text first, then any other language
    const obj = value as Record<string, unknown>;
    if (obj.fr && typeof obj.fr === 'string') return obj.fr;
    //if (obj.en_US && typeof obj.en_US === 'string') return obj.en_US;
    
    // If no English version, take the first available text
    const firstValue = Object.values(obj)[0];
    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }
  
  // Fallback: convert to string or return empty
  try {
    return String(value);
  } catch {
    return "";
  }
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

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Define a more specific type for organization data
interface OrgData {
  id?: string;
  name?: string | Record<string, string>;
  industry?: string;
  size_range?: string;
  logo_url?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  // Use a hardcoded locale since we're in a server component
  const locale = 'en';
  const organizationId = params.id as string;
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchJobDetail() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        if (!supabase) {
          throw new Error("Supabase client not available");
        }
        
        // Fetch the job with organization details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            requirements,
            job_type,
            status,
            remote,
            location,
            salary_min,
            salary_max,
            salary_currency,
            created_at,
            organization_id,
            processed,
            summary,
            organizations (
              id,
              name,
              industry,
              size_range,
              logo_url
            ),
            resumes (count)
          `)
          .eq('id', jobId)
          .eq('organization_id', organizationId)
          .single();
        
        if (jobError) {
          throw jobError;
        }
        
        if (!jobData) {
          setError("Job not found");
          setLoading(false);
          return;
        }
        
        // Determine job level and experience based on salary range
        let level = "Entry-level";
        let experience = "0-1 Years Experience";
        
        if (jobData.salary_min && jobData.salary_min >= 80000) {
          level = "Senior-level";
          experience = "5+ Years Experience";
        } else if (jobData.salary_min && jobData.salary_min >= 60000) {
          level = "Mid-level";
          experience = "3-5 Years Experience";
        } else if (jobData.salary_min && jobData.salary_min >= 40000) {
          level = "Entry-level";
          experience = "1-3 Years Experience";
        }
        
        // Format requirements as array
        let requirementsArray: string[] = [];
        if (typeof jobData.requirements === 'string') {
          try {
            requirementsArray = JSON.parse(jobData.requirements);
          } catch {
            requirementsArray = [jobData.requirements];
          }
        } else if (Array.isArray(jobData.requirements)) {
          requirementsArray = jobData.requirements;
        } else if (jobData.requirements && typeof jobData.requirements === 'object') {
          // Handle localized requirements
          const reqObj = jobData.requirements as Record<string, string[]>;
          requirementsArray = reqObj.fr || Object.values(reqObj)[0] || [];
        }
        
        // Get applicant count from processed data or resumes count
        const applicantCount = jobData.processed?.total_applicants || jobData.resumes?.[0]?.count || 0;
        
        // Extract organization data
        let orgData = {
          id: "",
          name: "Company",
          industry: "Technology",
          size_range: "Unknown",
          logo_url: undefined as string | undefined
        };
        
        if (jobData.organizations) {
          // Handle both array and object cases
          if (Array.isArray(jobData.organizations) && jobData.organizations.length > 0) {
            const org = jobData.organizations[0] as OrgData;
            orgData = {
              id: org.id || "",
              name: typeof org.name === 'string' ? org.name : 
                    org.name && typeof org.name === 'object' ? 
                    (org.name.fr || Object.values(org.name)[0] || "Company") : "Company",
              industry: org.industry || "Technology",
              size_range: org.size_range || "Unknown",
              logo_url: org.logo_url
            };
          } else if (typeof jobData.organizations === 'object') {
            const org = jobData.organizations as OrgData;
            orgData = {
              id: org.id || "",
              name: typeof org.name === 'string' ? org.name : 
                    org.name && typeof org.name === 'object' ? 
                    (org.name.fr || Object.values(org.name)[0] || "Company") : "Company",
              industry: org.industry || "Technology",
              size_range: org.size_range || "Unknown",
              logo_url: org.logo_url
            };
          }
        }
        
        // Transform the data to match our JobDetail interface
        const jobDetail: JobDetail = {
          id: jobData.id,
          title: getLocalizedText(jobData.title),
          description: getLocalizedText(jobData.description),
          requirements: requirementsArray,
          department: orgData.industry,
          level,
          experience,
          type: jobData.job_type.replace('_', ' ').toLowerCase(),
          mode: jobData.remote ? "Remote" : "On-site",
          salary: `$${jobData.salary_min/1000}k - $${jobData.salary_max/1000}k ${jobData.salary_currency}`,
          location: typeof jobData.location === 'object' 
            ? getLocalizedText(jobData.location.city) + ', ' + getLocalizedText(jobData.location.state)
            : jobData.location || "Remote",
          applicants: applicantCount,
          status: jobData.status,
          createdAt: jobData.created_at,
          summary: jobData.summary,
          organization: {
            id: orgData.id,
            name: getLocalizedText(orgData.name),
            industry: orgData.industry,
            size: orgData.size_range,
            size_range: orgData.size_range,
            logo: orgData.logo_url
          },
          processed: jobData.processed
        };
        
        setJob(jobDetail);
        
        // Update matches count if needed
        if (!jobData.processed?.total_applicants) {
          // Fetch matches count from API
          try {
            const response = await fetch(`/api/jobs/${jobData.id}/matches?size=1&update_stats=true`);
            if (response.ok) {
              const matchData = await response.json();
              if (matchData && typeof matchData.total === 'number') {
                // Update the job detail with the matches count
                setJob(prev => prev ? {
                  ...prev,
                  applicants: matchData.total,
                  processed: {
                    ...prev?.processed,
                    total_applicants: matchData.total,
                    last_processed_at: new Date().toISOString(),
                    processing_status: 'completed'
                  }
                } : prev);
              }
            }
          } catch (error) {
            console.error("Error fetching matches count:", error);
          }
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    }
    
    if (jobId && organizationId) {
      fetchJobDetail();
    }
  }, [jobId, organizationId]);
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Button>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading job details...</span>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleBack}
          >
            Go Back
          </Button>
        </div>
      )}
      
      {/* Job Detail Content */}
      {!loading && !error && job && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Job Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{job.title}</h1>
                      <Badge className={getStatusVariant(job.status)}>
                        {job.status === "PUBLISHED" ? "Active" : 
                         job.status === "DRAFT" ? "Draft" : 
                         job.status === "CLOSED" ? "Closed" : 
                         job.status === "ARCHIVED" ? "Archived" : job.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {job.department} • Posted on {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                {/* Job Details */}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 mb-8">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-sm">Job Level</span>
                    </div>
                    <p className="font-medium">{job.level}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Experience</span>
                    </div>
                    <p className="font-medium">{job.experience}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Location</span>
                    </div>
                    <p className="font-medium">{job.location}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Salary</span>
                    </div>
                    <p className="font-medium">{job.salary}</p>
                  </div>
                </div>
                
                {/* Job Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                  <JobDescription 
                    summary={job.summary}
                    fallbackDescription={job.description}
                    locale={locale}
                  />
                </div>
                
                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                    <ul className="list-disc pl-5 space-y-2">
                      {job.requirements.map((requirement, index) => (
                        <li key={index}>{requirement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Application Stats */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Application Statistics</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{job.applicants} Applicants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Posted {formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Resume Processing Statistics */}
                {job.processed && (
                  <div className="mt-6 bg-muted/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Resume Processing Statistics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <div className="text-sm text-muted-foreground">Total Applicants</div>
                        <div className="text-2xl font-bold">{job.processed.total_applicants}</div>
                      </div>
                      
                      {job.processed.average_match_score !== undefined && (
                        <div className="bg-white p-4 rounded-md shadow-sm">
                          <div className="text-sm text-muted-foreground">Average Match Score</div>
                          <div className="text-2xl font-bold">{(job.processed.average_match_score * 100).toFixed(1)}%</div>
                        </div>
                      )}
                      
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="text-lg font-medium">{formatDate(job.processed.last_processed_at)}</div>
                        <div className="text-xs text-muted-foreground capitalize">{job.processed.processing_status}</div>
                      </div>
                    </div>
                    
                    {job.processed.top_skills && job.processed.top_skills.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-3">Top Skills from Applicants</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {job.processed.top_skills.slice(0, 6).map((skill, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md">
                              <div className="font-medium">{skill.skill}</div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">{skill.count} applicants</span>
                                <span className="text-sm font-medium">{(skill.average_score * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Organization Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">About the Organization</h2>
                <div className="flex items-center gap-3 mb-4">
                  {job.organization.logo ? (
                    <Image 
                      src={job.organization.logo} 
                      alt={`${job.organization.name} logo`}
                      className="w-12 h-12 rounded-lg object-contain"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{job.organization.name}</h3>
                    <p className="text-sm text-muted-foreground">{job.organization.industry}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Company Size</h4>
                    <p>{job.organization.size_range || job.organization.size}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                    <p>{job.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-4">
                  {(job.processed && job.processed.total_applicants && job.processed.total_applicants > 0) ? (
                    <Link href={`/resume-processing/matches?jobId=${job.id}`}>
                      <Button className="w-full">View Applicants</Button>
                    </Link>
                  ) : (
                    <Link href={`/resume-processing?jobId=${job.id}`}>
                      <Button className="w-full">Process Resumes</Button>
                    </Link>
                  )}
                  <Button variant="outline" className="w-full">Edit Job</Button>
                  {job.status === "PUBLISHED" ? (
                    <Button variant="destructive" className="w-full">Close Job</Button>
                  ) : job.status === "CLOSED" || job.status === "ARCHIVED" ? (
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Reopen Job
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Publish Job
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 