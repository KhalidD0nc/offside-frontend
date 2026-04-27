'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Role = 'user' | 'assistant';

interface Evidence {
  label: string;
  value: string;
}

interface Citation {
  source: string;
  detail: string;
}

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  evidence?: Evidence[];
  citations?: Citation[];
  suggestedQuestions?: string[];
  usedTools?: string[];
}

interface AgentResponse {
  answer: string;
  evidence: Evidence[];
  citations: Citation[];
  suggestedQuestions: string[];
  usedTools: string[];
}

const STORAGE_KEY = 'offside-ai-assistant-session';
const HISTORY_STORAGE_KEY = 'offside-ai-assistant-history-collapsed';

const raisedShadow = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const insetShadow = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

const initialMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'I can help you analyze Al-Hilal data, compare recent match trends, inspect player form, and turn tactical patterns into coaching actions. I only serve football coaching work, so unrelated topics are rejected. What should we look at first?',
  evidence: [
    { label: 'Team scope', value: 'Al-Hilal Saudi FC' },
    { label: 'Mode', value: 'Read-only data analysis' },
  ],
  suggestedQuestions: [
    'What are our recurring defensive weaknesses?',
    'Who are the top performers this season?',
    'Compare our last 5 matches.',
    'Generate a drill plan from recent matches.',
  ],
  citations: [{ source: 'assistant_scope', detail: 'Limited to team_id 2932' }],
  usedTools: [],
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadMessages() {
  if (typeof window === 'undefined') return [initialMessage];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [initialMessage];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [initialMessage];
  } catch {
    return [initialMessage];
  }
}

function loadHistoryCollapsed() {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  return stored == null ? true : stored === 'true';
}

function serializeForApi(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .filter((message) => message.id !== 'welcome')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function MaterialIcon({
  name,
  filled = false,
  className = '',
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export default function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [historyCollapsed, setHistoryCollapsed] = useState(loadHistoryCollapsed);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, String(historyCollapsed));
  }, [historyCollapsed]);

  const historyItems = useMemo(
    () =>
      messages
        .filter((message) => message.role === 'user')
        .slice(-6)
        .reverse(),
    [messages],
  );

  async function sendMessage(nextPrompt?: string) {
    const content = (nextPrompt ?? input).trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: serializeForApi(nextMessages) }),
      });

      const payload = (await response.json()) as Partial<AgentResponse> & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'The AI Coach could not answer that question.');
      }

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: payload.answer || 'I could not produce an answer for that question.',
          evidence: payload.evidence ?? [],
          citations: payload.citations ?? [],
          suggestedQuestions: payload.suggestedQuestions ?? [],
          usedTools: payload.usedTools ?? [],
        },
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'The AI Coach is unavailable.');
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function resetChat() {
    setMessages([initialMessage]);
    setInput('');
    setError(null);
  }

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const suggestions = lastAssistant?.suggestedQuestions?.length
    ? lastAssistant.suggestedQuestions
    : initialMessage.suggestedQuestions;

  return (
    <section className="h-[calc(100vh-6rem)] min-h-[760px] overflow-hidden rounded-[2rem] bg-background">
      <div className="flex h-full overflow-hidden">
        <aside
          className={`hidden shrink-0 flex-col border-r border-outline-variant/30 bg-surface-container-low transition-[width,padding] duration-300 lg:flex ${
            historyCollapsed ? 'w-20 items-center p-4' : 'w-80 p-7'
          }`}
        >
          {historyCollapsed ? (
            <div className="flex h-full flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setHistoryCollapsed(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary transition-transform active:scale-95"
                style={{ boxShadow: raisedShadow }}
                aria-label="Expand chat history"
                title="Expand chat history"
              >
                <MaterialIcon name="keyboard_double_arrow_right" />
              </button>
              <button
                type="button"
                onClick={resetChat}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary transition-transform active:scale-95"
                style={{ boxShadow: raisedShadow }}
                aria-label="Start new chat"
                title="Start new chat"
              >
                <MaterialIcon name="edit_square" filled />
              </button>
              <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-on-surface-variant" style={{ boxShadow: insetShadow }}>
                <MaterialIcon name="history" />
              </div>
              <div className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary" style={{ boxShadow: insetShadow }}>
                <MaterialIcon name="lock" filled />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">Chat History</h2>
                  <p className="mt-1 text-xs text-on-surface-variant">Browser session</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHistoryCollapsed(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-on-surface-variant transition-colors hover:text-primary"
                    style={{ boxShadow: insetShadow }}
                    aria-label="Collapse chat history"
                    title="Collapse chat history"
                  >
                    <MaterialIcon name="keyboard_double_arrow_left" />
                  </button>
                  <button
                    type="button"
                    onClick={resetChat}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-primary transition-transform active:scale-95"
                    style={{ boxShadow: raisedShadow }}
                    aria-label="Start new chat"
                  >
                    <MaterialIcon name="edit_square" filled />
                  </button>
                </div>
              </div>

              <div className="space-y-7 overflow-y-auto pr-1">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Recent Questions
                  </p>
                  <div className="space-y-3">
                    {historyItems.length > 0 ? (
                      historyItems.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() => setInput(message.content)}
                          className="w-full rounded-[1.35rem] bg-surface-container p-4 text-left transition-colors hover:text-primary"
                          style={{ boxShadow: raisedShadow }}
                        >
                          <p className="line-clamp-2 text-sm font-medium">{message.content}</p>
                          <p className="mt-2 text-[10px] text-on-surface-variant">Reuse prompt</p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-surface-container-lowest p-4" style={{ boxShadow: insetShadow }}>
                        <p className="text-sm font-medium text-on-surface">Current session</p>
                        <p className="mt-1 text-xs text-on-surface-variant">Ask a question to build history.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.35rem] bg-surface-container-low p-5" style={{ boxShadow: insetShadow }}>
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <MaterialIcon name="lock" filled className="text-base" />
                    <p className="text-xs font-semibold">Data Guardrails</p>
                  </div>
                  <p className="text-xs leading-5 text-on-surface-variant">
                    The assistant serves the coaching field only: team analysis, tactics, training plans, match trends, and player form.
                  </p>
                </div>
              </div>
            </>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-24 shrink-0 items-center justify-between px-5 sm:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHistoryCollapsed((value) => !value)}
                className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-background text-on-surface-variant transition-colors hover:text-primary lg:flex"
                style={{ boxShadow: historyCollapsed ? raisedShadow : insetShadow }}
                aria-label={historyCollapsed ? 'Expand chat history' : 'Collapse chat history'}
                title={historyCollapsed ? 'Expand chat history' : 'Collapse chat history'}
              >
                <MaterialIcon name={historyCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'} />
              </button>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary"
                style={{ boxShadow: raisedShadow }}
              >
                <MaterialIcon name="smart_toy" filled />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-none text-on-surface">Offside AI Coach</h1>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="text-xs font-medium text-emerald-600">Coach field analysis only</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetChat}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-on-surface-variant transition-colors hover:text-primary lg:hidden"
              style={{ boxShadow: raisedShadow }}
              aria-label="Start new chat"
            >
              <MaterialIcon name="add_comment" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-10 overflow-y-auto px-5 py-6 sm:px-10">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex flex-col gap-4 ${message.role === 'user' ? 'ml-auto max-w-3xl' : 'max-w-4xl'}`}
              >
                <div
                  className={`rounded-[1.7rem] p-6 sm:p-7 ${
                    message.role === 'user' ? 'bg-surface-container-low text-on-primary-fixed-variant' : 'bg-surface'
                  }`}
                  style={{ boxShadow: message.role === 'user' ? insetShadow : raisedShadow }}
                >
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>

                  {message.evidence && message.evidence.length > 0 && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {message.evidence.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          className="rounded-[1.25rem] bg-surface-container-low p-4"
                          style={{ boxShadow: insetShadow }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {message.citations?.map((citation, index) => (
                      <span
                        key={`${citation.source}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-low px-3.5 py-2 text-[11px] font-semibold text-primary"
                        style={{ boxShadow: insetShadow }}
                      >
                        <MaterialIcon name="database" filled className="text-sm" />
                        {citation.source}: {citation.detail}
                      </span>
                    ))}
                    {message.usedTools && message.usedTools.length > 0 && (
                      <span className="text-[11px] font-medium text-outline">
                        Tools used: {message.usedTools.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}

            {isSending && (
              <div className="max-w-3xl rounded-[1.7rem] bg-surface p-7" style={{ boxShadow: raisedShadow }}>
                <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Reading Al-Hilal data and forming a coaching answer...
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 pb-6 pt-4 sm:px-10">
            {error && (
              <div
                className="mb-4 rounded-2xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mx-auto flex max-w-5xl items-center gap-5">
              <div className="relative flex-1">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="w-full rounded-[1.45rem] border-none bg-surface px-6 py-5 pr-14 text-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/20"
                  style={{ boxShadow: insetShadow }}
                  placeholder="Ask about tactics, player form, match trends, or training plans..."
                  disabled={isSending}
                />
                <MaterialIcon
                  name="psychology"
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-outline"
                />
              </div>
              <button
                type="submit"
                disabled={isSending || input.trim().length === 0}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.45rem] bg-background text-primary transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                style={{ boxShadow: raisedShadow }}
                aria-label="Send message"
              >
                <MaterialIcon name="send" filled className="text-2xl" />
              </button>
            </form>

            <div className="mx-auto mt-5 flex max-w-5xl flex-wrap justify-center gap-3">
              {suggestions?.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  disabled={isSending}
                  className="inline-flex items-center gap-1 rounded-xl px-3.5 py-2.5 text-[11px] font-bold text-on-surface-variant/70 transition-colors hover:text-primary disabled:opacity-50"
                >
                  <MaterialIcon name="lightbulb" filled className="text-sm" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
