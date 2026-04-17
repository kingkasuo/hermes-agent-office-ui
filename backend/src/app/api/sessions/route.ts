import { NextResponse } from 'next/server';
import { memoryStore } from '../../../lib/memory-store';
import { getSessions, exportSession } from '../../../lib/hermes-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withMessages = searchParams.get('withMessages') === 'true';
    const sessionId = searchParams.get('id');

    // If specific session ID requested
    if (sessionId) {
      const messages = await exportSession(sessionId);
      const session = memoryStore.getSession(sessionId);

      return NextResponse.json({
        session: session || { id: sessionId },
        messages: withMessages ? messages : undefined,
        messageCount: messages.length,
        timestamp: Date.now(),
      });
    }

    // Get all sessions
    const sessions = memoryStore.getAllSessions();

    if (sessions.length === 0) {
      // Fetch from CLI if not in memory
      const freshSessions = await getSessions();
      for (const session of freshSessions) {
        memoryStore.setSession(session);
      }

      return NextResponse.json({
        sessions: freshSessions,
        total: freshSessions.length,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      sessions,
      total: sessions.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}
