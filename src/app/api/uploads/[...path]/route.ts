// API route to serve uploaded files in production (Next.js standalone mode)
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15
    const { path: pathSegments } = await params

    // SECURITY: Validate path segments - reject any traversal attempts
    for (const segment of pathSegments) {
      if (segment === '..' || segment === '.' || segment.includes('..')) {
        console.warn('Path traversal attempt blocked:', pathSegments)
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    // Get the file path from the URL
    const filePath = pathSegments.join('/')

    // SECURITY: Define the allowed uploads directory
    // Use UPLOADS_PATH env var if set, otherwise fall back to relative path
    const uploadsDir = process.env.UPLOADS_PATH || path.resolve(process.cwd(), 'public', 'uploads')

    // Construct and resolve the full file path
    const fullPath = path.resolve(uploadsDir, filePath)

    // SECURITY: Ensure the resolved path is within the uploads directory
    if (!fullPath.startsWith(uploadsDir + path.sep) && fullPath !== uploadsDir) {
      console.warn('Path traversal attempt blocked - resolved path:', fullPath)
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Read the file
    const fileBuffer = await readFile(fullPath)

    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv'
    }

    const contentType = contentTypeMap[ext] || 'application/octet-stream'

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
