import { NextResponse } from 'next/server';
import { getJob } from '../../client';
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://147.93.44.131:8000'

const cachedFetch = cache(async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  return response.json();
});

// Define types for the document structure
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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const { searchParams } = new URL(request.url)
    const excludeFields = searchParams.get('exclude_fields')
    const offset = searchParams.get('offset') || '0'
    const size = searchParams.get('size') || '100'
    const updateStats = searchParams.get('update_stats') !== 'false' // Default to true

    // Get the job first to generate the correct index name
    const job = await getJob(id)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Generate the index name using the same format as the backend
    const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const indexName = `job-${titleSlug}-${id}`

    // Replace the fetch call with the cached version
    const data = await cachedFetch(
      `${REMOTE_API_URL}/v1/index/${indexName}/document?offset=${offset}&size=${size}${excludeFields ? `&exclude_fields=${excludeFields}` : ''}`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    )
    if (!data.documents) {
      // If the index doesn't exist, return empty results instead of an error
      if (data.status === 404) {
        return NextResponse.json({
          documents: [],
          total: 0
        })
      }
      throw new Error(`Remote API returned ${data.status}`)
    }

    const dataJson = data;
    
    // Filter out John Doe entries if data contains documents
    if (dataJson && dataJson.documents && Array.isArray(dataJson.documents)) {
      console.log(`Processing ${dataJson.documents.length} documents from job matches API`);
      
      const originalCount = dataJson.documents.length;
      
      // Filter out John Doe entries
      dataJson.documents = dataJson.documents.filter((doc: DocumentItem) => {
        // Check if document has valid profile data
        const hasValidProfile = doc.item_data?.content?.profile?.first_name && 
                               doc.item_data?.content?.profile?.last_name;
        
        // Check if name is "John Doe" (case insensitive)
        const isJohnDoe = hasValidProfile && 
                         doc.item_data?.content?.profile?.first_name?.toLowerCase() === "john" && 
                         doc.item_data?.content?.profile?.last_name?.toLowerCase() === "doe";
        
        // Log any John Doe entries we're filtering out
        if (isJohnDoe) {
          console.log('API route: Filtering out John Doe entry:', {
            id: doc.id,
            name: `${doc.item_data?.content?.profile?.first_name} ${doc.item_data?.content?.profile?.last_name}`,
            timestamp: doc.item_data?.timestamp
          });
        }
        
        // Keep only valid profiles that are not John Doe
        return hasValidProfile && !isJohnDoe;
      });
      
      const filteredCount = originalCount - dataJson.documents.length;
      if (filteredCount > 0) {
        console.log(`API route: Filtered out ${filteredCount} John Doe entries from job matches`);
        
        // Update total count if it exists
        if (dataJson.total) {
          dataJson.total = dataJson.documents.length;
        }
      }
      
      // Update job processed data in the database if requested
      if (updateStats && dataJson.documents.length > 0) {
        try {
          const supabase = createClient();
          
          // Calculate average match score
          let totalScore = 0;
          const skillsCount: Record<string, { count: number, totalScore: number }> = {};
          
          // Process documents to extract statistics
          dataJson.documents.forEach((doc: DocumentItem) => {
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
          const averageScore = dataJson.documents.length > 0 ? totalScore / dataJson.documents.length : 0;
          
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
                total_applicants: dataJson.documents.length,
                last_processed_at: new Date().toISOString(),
                processing_status: 'completed',
                average_match_score: averageScore,
                top_skills: topSkills,
                processing_duration: 0 // We don't have this info from the API
              }
            })
            .eq('id', id);
          
          if (error) {
            console.error('Error updating job processed data:', error);
          } else {
            console.log(`Updated processed data for job ${id} with ${dataJson.documents.length} applicants`);
          }
        } catch (error) {
          console.error('Error updating job processed data:', error);
          // Continue with the response even if updating stats fails
        }
      }
    } else {
      // If no documents, return empty array
      dataJson.documents = [];
      dataJson.total = 0;
    }
    
    return NextResponse.json(dataJson)
  } catch (error) {
    console.error('Error fetching job matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job matches' },
      { status: 500 }
    )
  }
} 