import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { videoUrl, caption } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { message: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Get the video filename from the URL
    const videoFilename = path.basename(videoUrl);
    
    // Generate a unique ID for the video
    const videoId = uuidv4();
    
    // Create the HTML content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>ISL Video with Caption</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f0f0f0;
            font-family: Arial, sans-serif;
            position: relative;
        }
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('/image/railway.jpg') no-repeat center center fixed;
            background-size: cover;
            opacity: 0.5;
            z-index: -1;
        }
        .video-container {
            width: 100%;
            max-width: 800px;
            margin: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: transparent;
        }
        video {
            width: 100%;
            max-width: 800px;
            height: auto;
            object-fit: contain;
            display: block;
        }
        .caption {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: clamp(14px, 3vw, 20px);
            font-family: Arial, sans-serif;
            padding: 10px;
            line-height: 1.5;
            text-align: center;
            width: 100%;
            max-width: 800px;
            box-sizing: border-box;
            margin-top: 10px;
        }
        @media screen and (max-width: 600px) {
            .video-container {
                margin: 10px;
            }
            video {
                max-width: 90vw;
            }
            .caption {
                font-size: clamp(12px, 2.5vw, 16px);
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="video-container">
        <video autoplay muted loop playsinline>
            <source src="/generated_videos/${videoFilename}" type="video/mp4">
            Your browser does not support the video tag. Please try another browser or check the file path.
        </video>
        <div class="caption">${caption || 'ISL Video Translation'}</div>
    </div>
</body>
</html>`;

    // Create the published_videos directory if it doesn't exist
    const publishedDir = path.join(process.cwd(), 'public', 'published_videos');
    await fs.mkdir(publishedDir, { recursive: true });

    // Generate a unique filename for the HTML file using the videoId
    const htmlFilename = `isl_video_${videoId}.html`;
    const htmlPath = path.join(publishedDir, htmlFilename);

    // Write the HTML file
    await fs.writeFile(htmlPath, htmlContent);

    // Generate the public URL using the API route
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const publicUrl = `${baseUrl}/api/serve-published-video?filename=${htmlFilename}`;

    return NextResponse.json({
      message: 'Video published successfully',
      videoId: videoId,
      htmlUrl: `/api/serve-published-video?filename=${htmlFilename}`,
      publicUrl: publicUrl
    });

  } catch (error) {
    console.error('Error publishing video:', error);
    return NextResponse.json(
      { message: 'Failed to publish video' },
      { status: 500 }
    );
  }
} 