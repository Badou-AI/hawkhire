import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user (optional for public view)
    const { data: { session } } = await supabase.auth.getSession()

    // Fetch from FastAPI backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/${params.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token 
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.message || "Failed to fetch organization" },
        { status: response.status }
      )
    }

    const organization = await response.json()
    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 