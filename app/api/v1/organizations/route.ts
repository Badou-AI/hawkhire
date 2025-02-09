import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get organization data from request
    const organizationData = await request.json()

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert([organizationData])
      .select()
      .single()

    if (orgError) {
      console.error("Error creating organization:", orgError)
      return NextResponse.json(
        { message: "Failed to create organization" },
        { status: 500 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error in organization creation:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 