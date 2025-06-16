import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE() {
  try {
    const generatedVideosPath = path.join(process.cwd(), 'public', 'generated_videos');
    const publishedVideosPath = path.join(process.cwd(), 'public', 'published_videos');

    // Delete generated videos
    try {
      const files = await fs.readdir(generatedVideosPath);
      await Promise.all(
        files.map(file => fs.unlink(path.join(generatedVideosPath, file)))
      );
      console.log('Generated videos deleted successfully');
    } catch (error) {
      console.error('Error deleting generated videos:', error);
    }

    // Delete published videos
    try {
      const files = await fs.readdir(publishedVideosPath);
      await Promise.all(
        files.map(file => fs.unlink(path.join(publishedVideosPath, file)))
      );
      console.log('Published videos deleted successfully');
    } catch (error) {
      console.error('Error deleting published videos:', error);
    }

    return NextResponse.json({
      message: 'All videos deleted successfully',
      details: {
        generatedVideos: 'Deleted',
        publishedVideos: 'Deleted'
      }
    });
  } catch (error) {
    console.error('Error in delete-generated-videos route:', error);
    return NextResponse.json(
      { message: 'Failed to delete videos' },
      { status: 500 }
    );
  }
} 