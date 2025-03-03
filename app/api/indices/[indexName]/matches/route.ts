import { NextResponse } from 'next/server';

const serviceUrl = process.env.RESUME_PROCESSING_URL || 'http://147.93.44.131:8000'

interface DocumentItem {
  id: string;
  item_data?: {
    content?: {
      profile?: {
        first_name?: string;
        last_name?: string;
      };
    };
  };
}

export async function GET(
  request: Request,
  { params }: { params: { indexName: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = searchParams.get('offset') || '0'
    const size = searchParams.get('size') || '5000'
    const excludeFields = searchParams.get('exclude_fields')

    // Ensure we have the indexName before proceeding
    if (!params?.indexName) {
      return NextResponse.json(
        { error: 'Index name is required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${serviceUrl}/v1/index/${params.indexName}/document?offset=${offset}&size=${size}${excludeFields ? `&exclude_fields=${excludeFields}` : ''}`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Resume processing service returned ${response.status}`)
    }

    const data = await response.json()
    
    // Filter out John Doe entries if data contains documents
    if (data && data.documents && Array.isArray(data.documents)) {
      console.log(`Processing ${data.documents.length} documents from indices matches API`);
      
      const originalCount = data.documents.length;
      
      // Filter out John Doe entries
      data.documents = data.documents.filter((doc: DocumentItem) => {
        // Check if document has valid profile data
        const hasValidProfile = doc?.item_data?.content?.profile?.first_name && 
                               doc?.item_data?.content?.profile?.last_name;
        
        // Check if name is "John Doe" (case insensitive)
        const isJohnDoe = hasValidProfile && 
                         doc?.item_data?.content?.profile?.first_name?.toLowerCase() === "john" && 
                         doc?.item_data?.content?.profile?.last_name?.toLowerCase() === "doe";
        
        // Log filtered entries
        if (isJohnDoe) {
          console.log(`Filtering out John Doe entry: ${doc?.item_data?.content?.profile?.first_name} ${doc?.item_data?.content?.profile?.last_name}`);
        }
        
        // Keep entries that are not John Doe
        return !isJohnDoe;
      });
      
      const filteredCount = originalCount - data.documents.length;
      if (filteredCount > 0) {
        console.log(`Indices API route: Filtered out ${filteredCount} John Doe entries from matches`);
        
        // Update total count if it exists
        if (data.total) {
          data.total = data.documents.length;
        }
      }
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidate matches' },
      { status: 500 }
    )
  }
} 