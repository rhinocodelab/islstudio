import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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
    
    // Use fixed filename
    const htmlFilename = 'isl_video.html';
    
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
            opacity: 1;
            transition: opacity 0.5s ease-in-out;
        }
        .video-container.fade-out {
            opacity: 0;
        }
        video {
            width: 100%;
            max-width: 800px;
            height: auto;
            object-fit: contain;
            display: block;
            transition: transform 0.5s ease-in-out;
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
            transition: opacity 0.5s ease-in-out;
        }
        .caption.fade-out {
            opacity: 0;
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
        <video autoplay muted loop playsinline id="videoPlayer">
            <source src="/generated_videos/${videoFilename}" type="video/mp4">
            Your browser does not support the video tag. Please try another browser or check the file path.
        </video>
        <div class="caption">${caption || 'ISL Video Translation'}</div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const video = document.getElementById('videoPlayer');
            const container = document.querySelector('.video-container');
            const caption = document.querySelector('.caption');
            
            if (video) {
                // Remove loop attribute after first play
                video.addEventListener('play', function() {
                    video.loop = false;
                }, { once: true });

                // Add ended event listener with smooth transition
                video.addEventListener('ended', function() {
                    console.log('Video ended, preparing to refresh...');
                    
                    // Add fade-out class to elements
                    container.classList.add('fade-out');
                    caption.classList.add('fade-out');
                    
                    // Wait for fade-out animation to complete
                    setTimeout(() => {
                        window.location.reload();
                    }, 500); // Reduced to 500ms to match the CSS transition
                });

                // Add error handling with smooth transition
                video.addEventListener('error', function(e) {
                    console.error('Video error:', e);
                    
                    // Add fade-out class to elements
                    container.classList.add('fade-out');
                    caption.classList.add('fade-out');
                    
                    // Wait for fade-out animation to complete
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                });
            } else {
                console.error('Video element not found');
            }
        });
    </script>
</body>
</html>`;

    // Create the published_videos directory if it doesn't exist
    const publishedDir = path.join(process.cwd(), 'public', 'published_videos');
    await fs.mkdir(publishedDir, { recursive: true });

    const htmlPath = path.join(publishedDir, htmlFilename);

    // Write the HTML file
    await fs.writeFile(htmlPath, htmlContent);

    // Generate the public URL using the API route
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.1.92:9002';
    const publicUrl = `${baseUrl}/api/serve-published-video?filename=${htmlFilename}`;

    return NextResponse.json({
      message: 'Video published successfully',
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