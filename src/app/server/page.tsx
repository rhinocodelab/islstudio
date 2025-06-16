import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getServerTime() {
  return new Date().toISOString();
}

export default async function ServerPage() {
  const headersList = headers();
  const serverTime = await getServerTime();
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Server Component Example</h1>
        
        <div className="space-y-6">
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Server Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Server Time:</span> {serverTime}</p>
              <p><span className="font-medium">User Agent:</span> {headersList.get('user-agent') ?? 'Unknown'}</p>
              <p><span className="font-medium">Host:</span> {headersList.get('host') ?? 'Unknown'}</p>
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Static Content</h2>
            <p className="text-muted-foreground">
              This content is rendered on the server and sent as HTML to the client.
              The server time above is generated at request time.
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Server-Side Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Direct database access</li>
              <li>File system operations</li>
              <li>Environment variables access</li>
              <li>API key management</li>
              <li>Server-side caching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 