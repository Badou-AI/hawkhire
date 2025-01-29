import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']),
  title: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to invite members
    const { rows: [member] } = await query(
      `SELECT role FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [params.id, user.id]
    )

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = inviteSchema.parse(body)

    // Check if user is already a member
    const { rows: [existingMember] } = await query(
      `SELECT id FROM organization_members 
       WHERE organization_id = $1 AND user_id = (
         SELECT id FROM auth.users WHERE email = $2
       )`,
      [params.id, validatedData.email]
    )

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      )
    }

    // Create member invitation
    const { rows: [invitation] } = await query(
      `INSERT INTO organization_members (
         organization_id,
         user_id,
         role,
         title,
         invited_by,
         status
       ) VALUES (
         $1,
         (SELECT id FROM auth.users WHERE email = $2),
         $3,
         $4,
         $5,
         'pending'
       ) RETURNING *`,
      [params.id, validatedData.email, validatedData.role, validatedData.title, user.id]
    )

    // TODO: Send invitation email

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error inviting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { rows: members } = await query(
      `SELECT 
         om.*,
         u.email,
         u.user_metadata->>'full_name' as name,
         u.user_metadata->>'avatar_url' as avatar_url
       FROM organization_members om
       JOIN auth.users u ON om.user_id = u.id
       WHERE om.organization_id = $1
       ORDER BY 
         CASE om.role
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           ELSE 3
         END,
         om.created_at DESC`,
      [params.id]
    )

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to update members
    const { rows: [currentMember] } = await query(
      `SELECT role FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [params.id, user.id]
    )

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { memberId, role } = body

    // Only owners can assign owner role
    if (role === 'owner' && currentMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can assign owner role' },
        { status: 403 }
      )
    }

    // Update member role
    const { rows: [updatedMember] } = await query(
      `UPDATE organization_members 
       SET role = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [role, memberId, params.id]
    )

    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const memberId = url.searchParams.get('memberId')
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to remove members
    const { rows: [currentMember] } = await query(
      `SELECT role FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [params.id, user.id]
    )

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if target member exists and their role
    const { rows: [targetMember] } = await query(
      `SELECT role FROM organization_members WHERE id = $1`,
      [memberId]
    )

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Only owners can remove other owners
    if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can remove other owners' },
        { status: 403 }
      )
    }

    // Remove member
    await query(
      `DELETE FROM organization_members WHERE id = $1`,
      [memberId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 