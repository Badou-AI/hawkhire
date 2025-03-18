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
        { message: orgError.message || "Failed to create organization" },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Verify member creation
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      console.error("Error verifying member creation:", memberError)
      // Clean up the organization if member creation failed
      await supabase
        .from("organizations")
        .delete()
        .eq('id', organization.id)
      
      return NextResponse.json(
        { message: "Failed to create organization member" },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return NextResponse.json(organization, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error("Error in organization creation:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 