import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createClient()
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get job data from request and ensure organization_id matches
    const jobData = await request.json()
    jobData.organization_id = resolvedParams.id // Ensure organization_id matches URL param

    // Forward to FastAPI backend with correct endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/jobs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(jobData),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.message || "Failed to create job" },
        { status: response.status }
      )
    }

    const job = await response.json()
    return NextResponse.json(job)
  } catch (error) {
    console.error("Error in job creation:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 