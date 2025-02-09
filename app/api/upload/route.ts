import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'misc'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '')
    const uniqueId = Math.random().toString(36).substring(2, 15)
    const filename = `${timestamp}_${uniqueId}_${file.name}`
    const filePath = `${folder}/${filename}`

    console.log('Attempting upload to bucket:', 'company-assets')
    console.log('File path:', filePath)
    console.log('Content type:', file.type)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('company-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      path: filePath
    })

  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 