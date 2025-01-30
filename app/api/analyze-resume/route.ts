import { NextRequest } from 'next/server';

interface Skill {
  skill: string;
  score: number;
  justification: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  tel_num: string;
  email: string;
}

interface ContentData {
  title: string;
  profile: Profile;
  years_of_experience: number;
  summary: string;
  skills: Skill[];
  topics: string;
}

interface MatchingScore {
  data: {
    score: {
      meta: {
        value: number;
      }
    }
  }
}

interface ApiResponse {
  upload_id: string;
  job_id: string;
  timestamp: string;
  content: {
    data: ContentData;
  };
  matching_score: MatchingScore;
  feedback: {
    content: string;
    slug: string;
    url: string;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resume = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;

    if (!resume) {
      return Response.json({ error: 'Resume file is required' }, { status: 400 });
    }

    if (!jobDescription) {
      return Response.json({ error: 'Job description is required' }, { status: 400 });
    }

    // Validate file type
    if (!resume.type || !['application/pdf', 'text/plain'].includes(resume.type)) {
      return Response.json({ error: 'Only PDF and text files are supported' }, { status: 400 });
    }

    // Convert File to FormData for backend API
    const apiFormData = new FormData();
    apiFormData.append('resume', resume);
    apiFormData.append('job_description', jobDescription);
    apiFormData.append('existing_job_id', '');
    apiFormData.append('exclude_fields', 'embedding');

    // Call backend API
    const response = await fetch('http://127.0.0.1:8080/v1/analyze-resume', {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.detail || 'Failed to analyze resume' }, { status: response.status });
    }

    const analysis = await response.json() as ApiResponse;
    
    // Transform the response to match our UI components' expected format
    return Response.json({
      matchScore: analysis.matching_score.data.score.meta.value,
      skills: analysis.content.data.skills,
      feedback: analysis.feedback.content
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return Response.json({ 
      error: 'Internal server error while analyzing resume' 
    }, { 
      status: 500 
    });
  }
} 