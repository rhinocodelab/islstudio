import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const datasetPath = path.join(process.cwd(), 'public/isl_dataset');
    const items = await fs.readdir(datasetPath);
    
    const dictionary = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(datasetPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(itemPath);
          const videoFile = files.find(file => file.endsWith('.mp4'));
          
          if (videoFile) {
            return {
              word: item,
              videoPath: `/isl_dataset/${item}/${videoFile}`
            };
          }
        }
        return null;
      })
    );

    // Filter out null values and sort alphabetically
    const filteredDictionary = dictionary
      .filter((item): item is { word: string; videoPath: string } => item !== null)
      .sort((a, b) => a.word.localeCompare(b.word));

    return NextResponse.json(filteredDictionary);
  } catch (error) {
    console.error('Error reading ISL dataset:', error);
    return NextResponse.json(
      { error: 'Failed to read ISL dataset' },
      { status: 500 }
    );
  }
} 