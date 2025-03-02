import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getJobs } from '@/app/api/jobs/client';

const REMOTE_API_URL = process.env.REMOTE_API_URL || 'http://147.93.44.131:8000'

// Define types for the API responses
interface IndexExistResponse {
  was_found: boolean;
}

interface IndexCountResponse {
  index_size: number;
}

interface DocumentItem {
  id: string;
  item_data?: {
    content?: {
      profile?: {
        first_name?: string;
        last_name?: string;
      };
      skills?: Array<{
        skill: string;
        score: number;
      }>;
    };
    matching_score?: {
      data?: {
        score?: {
          value: number;
        };
      };
    };
    timestamp?: string;
  };
}

interface DocumentsResponse {
  documents?: DocumentItem[];
  total?: number;
}

interface JobProcessingResult {
  jobId: string;
  indexName?: string;
  status: 'processed' | 'skipped' | 'error';
  reason?: string;
  documentCount?: number;
  error?: string;
}

// Helper function to get title as string
const getJobTitle = (title: string | { en: string; fr?: string } | Record<string, string>): string => {
  if (typeof title === 'string') {
    return title;
  }
  
  // Handle localized text object
  if (title && typeof title === 'object') {
    if ('en' in title && typeof title.en === 'string') {
      return title.en;
    }
    
    // Try to find any string value in the object
    const record = title as Record<string, unknown>;
    for (const key in record) {
      if (typeof record[key] === 'string') {
        return record[key] as string;
      }
    }
  }
  
  // Fallback
  return 'untitled-job';
};

// Helper function to generate index name from job title and ID
const generateIndexName = (jobId: string, jobTitle: string | { en: string; fr?: string } | Record<string, string>): string => {
  const titleStr = getJobTitle(jobTitle);
  const slug = titleStr.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  return `job-${slug}-${jobId}`;
}

// Check if an index exists
async function checkIndexExists(indexName: string): Promise<boolean> {
  try {
    const response = await fetch(`${REMOTE_API_URL}/v1/index/${indexName}/exist`, {
      headers: {
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json() as IndexExistResponse;
    return data.was_found === true;
  } catch (error) {
    console.error(`Error checking if index ${indexName} exists:`, error);
    return false;
  }
}

// Get document count for an index
async function getDocumentCount(indexName: string): Promise<number> {
  try {
    const response = await fetch(`${REMOTE_API_URL}/v1/index/${indexName}/count`, {
      headers: {
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json() as IndexCountResponse;
    return data.index_size || 0;
  } catch (error) {
    console.error(`Error getting document count for index ${indexName}:`, error);
    return 0;
  }
}

// Get documents for an index
async function getDocuments(indexName: string): Promise<DocumentsResponse> {
  try {
    const response = await fetch(
      `${REMOTE_API_URL}/v1/index/${indexName}/document?offset=0&size=5000&exclude_fields=embedding`, 
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      return { documents: [] };
    }
    
    return await response.json() as DocumentsResponse;
  } catch (error) {
    console.error(`Error getting documents for index ${indexName}:`, error);
    return { documents: [] };
  }
}

// Update processed data for a job
async function updateJobProcessedData(jobId: string, indexName: string, documentCount: number, documents: DocumentItem[]): Promise<void> {
  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error(`Failed to create Supabase client for job ${jobId}`);
      return;
    }
    
    // Calculate average match score
    let totalScore = 0;
    const skillsCount: Record<string, { count: number, totalScore: number }> = {};
    
    // Process documents to extract statistics
    documents.forEach((doc: DocumentItem) => {
      // Add to total score if available
      if (doc.item_data?.matching_score?.data?.score?.value) {
        totalScore += doc.item_data.matching_score.data.score.value;
      }
      
      // Count skills and their scores
      if (doc.item_data?.content?.skills && Array.isArray(doc.item_data.content.skills)) {
        doc.item_data.content.skills.forEach((skillObj: { skill: string; score: number }) => {
          if (skillObj.skill && typeof skillObj.score === 'number') {
            if (!skillsCount[skillObj.skill]) {
              skillsCount[skillObj.skill] = { count: 0, totalScore: 0 };
            }
            skillsCount[skillObj.skill].count += 1;
            skillsCount[skillObj.skill].totalScore += skillObj.score;
          }
        });
      }
    });
    
    // Calculate average score
    const averageScore = documents.length > 0 ? totalScore / documents.length : 0;
    
    // Get top skills
    const topSkills = Object.entries(skillsCount)
      .map(([skill, { count, totalScore }]) => ({
        skill,
        count,
        average_score: totalScore / count
      }))
      .sort((a, b) => b.count - a.count || b.average_score - a.average_score)
      .slice(0, 10);
    
    // Update the job's processed data
    const { error } = await supabase
      .from('jobs')
      .update({
        processed: {
          index_name: indexName,
          total_applicants: documentCount,
          last_processed_at: new Date().toISOString(),
          processing_status: 'completed',
          average_match_score: averageScore,
          top_skills: topSkills,
          processing_duration: 0 // We don't have this info
        }
      })
      .eq('id', jobId);
    
    if (error) {
      console.error(`Error updating processed data for job ${jobId}:`, error);
    } else {
      console.log(`Updated processed data for job ${jobId} with ${documentCount} applicants`);
    }
  } catch (error) {
    console.error(`Error updating processed data for job ${jobId}:`, error);
  }
}

export async function GET() {
  try {
    // Get all jobs
    const { data: jobs } = await getJobs(0, 1000); // Get up to 1000 jobs
    
    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }
    
    console.log(`Processing ${jobs.length} jobs`);
    
    // Process each job
    const results: JobProcessingResult[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const job of jobs) {
      try {
        // Generate index name
        const indexName = generateIndexName(job.id, job.title);
        
        // Check if index exists
        const indexExists = await checkIndexExists(indexName);
        if (!indexExists) {
          results.push({
            jobId: job.id,
            indexName,
            status: 'skipped',
            reason: 'Index does not exist'
          });
          skippedCount++;
          continue;
        }
        
        // Get document count
        const documentCount = await getDocumentCount(indexName);
        if (documentCount === 0) {
          results.push({
            jobId: job.id,
            indexName,
            status: 'skipped',
            reason: 'No documents in index',
            documentCount: 0
          });
          skippedCount++;
          continue;
        }
        
        // Get documents
        const { documents } = await getDocuments(indexName);
        if (!documents || documents.length === 0) {
          results.push({
            jobId: job.id,
            indexName,
            status: 'skipped',
            reason: 'No documents returned',
            documentCount: 0
          });
          skippedCount++;
          continue;
        }
        
        // Update job processed data
        await updateJobProcessedData(job.id, indexName, documents.length, documents);
        
        results.push({
          jobId: job.id,
          indexName,
          status: 'processed',
          documentCount: documents.length
        });
        processedCount++;
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        results.push({
          jobId: job.id,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
        errorCount++;
      }
    }
    
    return NextResponse.json({
      total: jobs.length,
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
      results
    });
  } catch (error) {
    console.error('Error updating processed data:', error);
    return NextResponse.json(
      { error: 'Failed to update processed data' },
      { status: 500 }
    );
  }
} 