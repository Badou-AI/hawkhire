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
    const jobDescription = formData.get('job_description') as string;

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
      matchScore: analysis.matching_score.data.score.meta.value * 100, // Convert to percentage
      skills: analysis.content.data.skills.map(skill => ({
        skill: skill.skill,
        level: skill.score >= 0.8 ? "Expert" : skill.score >= 0.6 ? "Proficient" : "Basic",
        score: skill.score * 100, // Convert to percentage
        description: skill.justification
      })),
      feedback: {
        overview: analysis.feedback.content,
        strengths: analysis.content.data.skills
          .filter(skill => skill.score >= 0.7)
          .map(skill => ({
            skill: skill.skill,
            analysis: skill.justification,
            relevance: skill.score >= 0.8 ? "Critical" : "Important"
          })),
        gaps: analysis.content.data.skills
          .filter(skill => skill.score < 0.7)
          .map(skill => ({
            skill: skill.skill,
            importance: skill.score < 0.5 ? "Critical" : "Important",
            suggestion: `Improve your ${skill.skill} skills through practice and learning.`,
            impact: skill.justification
          })),
        improvementPlan: {
          shortTerm: [
            "Focus on improving identified critical gaps",
            "Take online courses in weak areas",
            "Practice with real-world projects"
          ],
          longTerm: [
            "Gain professional experience in key areas",
            "Pursue relevant certifications",
            "Build a portfolio demonstrating improved skills"
          ],
          resumeSuggestions: [
            "Highlight your strongest skills more prominently",
            "Add specific metrics and achievements",
            "Include relevant certifications and training"
          ]
        }
      }
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