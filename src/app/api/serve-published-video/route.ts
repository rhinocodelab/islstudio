import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { message: 'Filename is required' },
        { status: 400 }
      );
    }

    // Ensure the filename is safe and only contains allowed characters
    if (!/^isl_video_[a-f0-9-]+\.html$/.test(filename)) {
      return NextResponse.json(
        { message: 'Invalid filename format' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'published_videos', filename);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Return the HTML content with appropriate headers
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error serving published video:', error);
    return NextResponse.json(
      { message: 'Failed to serve published video' },
      { status: 500 }
    );
  }
} 