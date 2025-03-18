import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Log the raw request URL for debugging
    console.log('Raw request URL:', request.url);
    
    // Get path segments and clean them
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;
    console.log('Raw path segments:', pathSegments);

    // Clean the last segment (filename) by trimming spaces and ensuring single .pdf extension
    const lastIndex = pathSegments.length - 1;
    pathSegments[lastIndex] = pathSegments[lastIndex]
      .trim()
      .replace(/\.pdf\.pdf$/, '.pdf')
      .replace(/\s+\.pdf$/, '.pdf');

    // Join path segments and normalize
    const normalizedPath = pathSegments.join('/');
    console.log('Normalized path:', normalizedPath);
    
    // Get workspace root (project root directory)
    const workspaceRoot = process.cwd();
    console.log('Workspace root:', workspaceRoot);
    
    // Construct the full file path
    const filePath = join(workspaceRoot, normalizedPath);
    console.log('Full file path:', filePath);
    
    // Security check - ensure path is within backend/storage
    if (!normalizedPath.startsWith('backend/storage/')) {
      console.error('Security check failed - path must start with backend/storage/');
      return new NextResponse('Invalid path', { status: 403 });
    }

    // Try multiple variations of the file path
    const variations = [
      filePath,
      filePath.replace(/\s+\.pdf$/, '.pdf'),  // Remove extra spaces before .pdf
      `${filePath.replace(/\.pdf$/, '')}.pdf`, // Ensure single .pdf extension
    ];

    let fileBuffer: Buffer | null = null;
    let foundPath: string | null = null;

    for (const path of variations) {
      console.log('Trying path:', path);
      if (existsSync(path)) {
        foundPath = path;
        fileBuffer = await readFile(path);
        break;
      }
    }

    if (!fileBuffer || !foundPath) {
      console.error('File not found after trying variations');
      return new NextResponse('File not found', { status: 404 });
    }

    console.log('Successfully found and read file at:', foundPath);
    console.log('File size:', fileBuffer.length, 'bytes');

    // Set appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(`Error serving file: ${errorMessage}`, { status: 500 });
  }
} 