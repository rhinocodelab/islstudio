import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const publishConfigPath = join(process.cwd(), 'src/config/publish.ini');
    const publishConfig = readFileSync(publishConfigPath, 'utf8');
    const ipAddress = publishConfig.match(/PUBLISHED_URL_IP=([^\n]+)/)?.[1];

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'Could not read IP address from publish.ini' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ipAddress });
  } catch (error) {
    console.error('Error reading publish config:', error);
    return NextResponse.json(
      { error: 'Failed to read publish configuration' },
      { status: 500 }
    );
  }
} 