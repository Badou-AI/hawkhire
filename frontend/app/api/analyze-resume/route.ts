import { NextRequest } from 'next/server';

// Use environment variable for API URL with fallback to local address
const isDev = process.env.NODE_ENV === 'development';
const API_URL = process.env.PYTHON_API_URL || (isDev ? 'http://backend:8080' : '/api');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resume = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const existingJobId = formData.get('existingJobId') as string | null;

    if (!resume) {
      return Response.json({ error: 'Resume file is required' }, { status: 400 });
    }

    if (!jobDescription && !existingJobId) {
      return Response.json({ error: 'Either job description or existing job ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!resume.type || !['application/pdf', 'text/plain'].includes(resume.type)) {
      return Response.json({ error: 'Only PDF and text files are supported' }, { status: 400 });
    }

    // Convert File to FormData for backend API
    const apiFormData = new FormData();
    apiFormData.append('resume', resume);
    apiFormData.append('job_description', jobDescription);
    if (existingJobId) {
      apiFormData.append('existing_job_id', existingJobId);
    }

    // Call backend API
    const response = await fetch(`${API_URL}/v1/analyze-resume`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.detail || 'Failed to analyze resume' }, { status: response.status });
    }

    const analysis = await response.json();
    
    return Response.json({
      matchScore: analysis.match_score,
      matchedSkills: analysis.matched_skills,
      missingKeywords: analysis.missing_keywords,
      recommendations: analysis.recommendations,
      error: null
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