import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const datasetPath = path.join(process.cwd(), 'public', 'isl_dataset');
    const entries = await fs.readdir(datasetPath, { withFileTypes: true });
    
    // Filter for directories and sort alphabetically
    const words = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error reading ISL dataset:', error);
    return NextResponse.json(
      { error: 'Failed to read ISL dataset' },
      { status: 500 }
    );
  }
} 