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
    const { additional_locations, ...rest } = organizationData

    // Ensure JSONB fields are properly serialized
    const serializedData = {
      ...rest,
      name: JSON.stringify(organizationData.name),
      description: JSON.stringify(organizationData.description),
      primary_location: JSON.stringify(organizationData.primary_location),
    }

    // Set the user's email for the trigger function
    const { error: configError } = await supabase.rpc('set_config', {
      key: 'app.current_user_email',
      value: user.email
    })

    if (configError) {
      console.error("Error setting user email:", configError)
      return NextResponse.json(
        { message: "Failed to set user configuration" },
        { status: 500 }
      )
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert([serializedData])
      .select()
      .single()

    if (orgError) {
      console.error("Error creating organization:", orgError)
      return NextResponse.json(
        { message: orgError.message || "Failed to create organization" },
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