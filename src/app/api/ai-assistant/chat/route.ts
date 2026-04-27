import { runCoachAgent, type CoachChatMessage } from '@/lib/ai/coach-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isChatMessage(value: unknown): value is CoachChatMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { role?: unknown; content?: unknown };
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: unknown };
    const messages = Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
      return Response.json(
        {
          error: 'Send at least one user message to ask the AI Coach a question.',
        },
        { status: 400 },
      );
    }

    const response = await runCoachAgent(messages);
    return Response.json(response);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The AI Coach could not complete this request. Try a narrower football question.',
      },
      { status: 500 },
    );
  }
}
