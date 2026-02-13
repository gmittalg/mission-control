import { NextRequest, NextResponse } from 'next/server';
import { getOpenClawClient } from '@/lib/openclaw/client';
import { getClientId } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/openclaw/sessions/[id]/history - Get conversation history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = getClientId(request);
    const client = getOpenClawClient(clientId);

    if (!client.isConnected()) {
      try {
        await client.connect();
      } catch {
        return NextResponse.json(
          { error: 'Failed to connect to OpenClaw Gateway' },
          { status: 503 }
        );
      }
    }

    const history = await client.getSessionHistory(id);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to get OpenClaw session history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
