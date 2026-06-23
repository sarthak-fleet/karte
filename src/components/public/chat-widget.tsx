'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { renderComponent } from '@/components/public/ai-components/registry';
import { ChatEmailGate } from '@/components/public/chat-email-gate';
import { ChatMessageBody } from '@/components/public/chat-message-body';
import { ContactFormSection } from '@/components/public/contact-form-section';
import type { DmMode } from '@/db/schema';
import { applyLayoutDirectives } from '@/lib/ai-components/layout';
import {
  createStreamParserState,
  feedChunk,
  finishStream,
} from '@/lib/ai-components/stream-parser';
import type {
  LayoutDirectives,
  RenderableComponent,
} from '@/lib/ai-components/types';
import { trackEvent } from '@/lib/analytics';
import {
  buildRoomShareUrl,
  clearStoredRoomId,
  getStoredRoomId,
  setStoredRoomId,
} from '@/lib/chat-room';
import { captureActionFailure } from '@/lib/foundry-monitoring';
import { getOrCreateVisitorId } from '@/lib/visitor-id';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  // Optional generative-UI components emitted by the assistant
  // alongside the text response. Rendered inline beneath content.
  components?: RenderableComponent[];
  // Optional layout directives that apply to this reply's components
  // (density/order/filter/hide/mood). Scoped to the message — the
  // page itself is never mutated by a layout directive.
  layout?: LayoutDirectives;
}

type ChatPosition = 'bottom-right' | 'bottom-left';

const EMPTY_CHAT_RESPONSE_MESSAGE =
  "I didn't get a response back. Please try again in a moment.";
const CHAT_SERVICE_UNAVAILABLE_MESSAGE =
  "Couldn't reach the chat service. Check your connection and try sending again.";

function ChatLoadingIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 py-0.5 text-white/65">
      <span>{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: '300ms' }}
        />
      </span>
    </span>
  );
}

function getButtonTextColor(color: string) {
  const normalized = color.trim().replace('#', '');
  const hex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (!/^[\da-fA-F]{6}$/.test(hex)) {
    return '#111827';
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? '#111827' : '#ffffff';
}

export function ChatWidget({
  slug,
  displayName,
  accentColor = '#2563eb',
  position = 'bottom-right',
  chatEnabled = true,
  dmMode = 'off',
  initialRoomId: initialRoomIdProp = null,
}: {
  slug: string;
  displayName: string;
  accentColor?: string;
  position?: ChatPosition;
  chatEnabled?: boolean;
  dmMode?: DmMode;
  initialRoomId?: string | null;
}) {
  // Read room id from URL on the client so the server page can stay
  // static-cacheable. Prop still wins if a parent decides to pass it
  // (e.g. SSR forking from a different param source later).
  const searchParams = useSearchParams();
  const initialRoomId = initialRoomIdProp ?? searchParams?.get('room') ?? null;

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const prevOpenRef = useRef(false);
  const [mode, setMode] = useState<'chat' | 'contact'>(
    chatEnabled ? 'chat' : 'contact',
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState<
    'idle' | 'loading' | 'error' | 'loaded'
  >('idle');
  const [shareCopied, setShareCopied] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  // Email gate: required once per browser before a visitor can chat.
  // Mirrored to localStorage (`karte_visitor_email`) for stickiness and
  // persisted server-side on the conversation row (see `/api/chat/[slug]/conversations`).
  const [visitorEmail, setVisitorEmail] = useState<string | null>(null);
  const [emailHydrated, setEmailHydrated] = useState(false);
  const historyAttemptedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const visitorIdRef = useRef<string | null>(null);
  const accentTextColor = getButtonTextColor(accentColor);
  const dmEnabled = dmMode !== 'off';
  const isGuestPreview =
    !!initialRoomId &&
    historyStatus === 'loaded' &&
    messages.length > 0 &&
    !hasJoined;
  const isFirstMessage =
    mode === 'chat' &&
    chatEnabled &&
    messages.length === 0 &&
    historyStatus !== 'loading';
  const showPendingAssistant =
    loading && messages[messages.length - 1]?.role === 'user';
  const starterPrompts = [
    `What does ${displayName} do?`,
    `Latest projects?`,
    `How can I reach out?`,
  ];

  function handleJoinChat() {
    setHasJoined(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleStarterPrompt(prompt: string) {
    setInput(prompt);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, historyStatus]);

  useEffect(() => {
    if (!input && inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      void fetch(`/api/track/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'hook_open',
          visitorId: visitorIdRef.current,
        }),
        keepalive: true,
      });
    }
    prevOpenRef.current = open;
  }, [open, slug]);

  useEffect(() => {
    if (open && mode === 'chat') {
      inputRef.current?.focus();
    }
  }, [open, mode]);

  useEffect(() => {
    if (!chatEnabled && mode === 'chat') {
      setMode('contact');
    }
  }, [chatEnabled, mode]);

  useEffect(() => {
    visitorIdRef.current = getOrCreateVisitorId();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('karte_visitor_email');
      if (stored && /^\S+@\S+\.\S+$/.test(stored)) {
        setVisitorEmail(stored);
      }
    } catch {
      // localStorage may be disabled; gate will simply re-prompt.
    }
    setEmailHydrated(true);
  }, []);

  function handleEmailCaptured(email: string) {
    setVisitorEmail(email);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('karte_visitor_email', email);
      } catch {
        // best-effort
      }
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const loadRoomHistory = useCallback(
    async (roomId: string) => {
      setHistoryStatus('loading');

      try {
        const res = await fetch(
          `/api/chat/${slug}/messages?conversationId=${encodeURIComponent(roomId)}`,
        );

        if (!res.ok) {
          if (res.status === 404) {
            clearStoredRoomId(slug);
            setConversationId(null);
            setMessages([]);
          }
          setHistoryStatus('error');
          return;
        }

        const msgs = (await res.json()) as Array<{
          role: 'user' | 'assistant';
          content: string;
        }>;

        setConversationId(roomId);
        setStoredRoomId(slug, roomId);
        setMessages(
          msgs.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        );
        setHistoryStatus('loaded');
      } catch (err) {
        captureActionFailure(err, { action: 'chat_load_history' });
        setHistoryStatus('error');
      }
    },
    [slug],
  );

  useEffect(() => {
    if (!initialRoomId || !chatEnabled) return;

    setOpen(true);
    setMode('chat');
    historyAttemptedRef.current = true;
    void loadRoomHistory(initialRoomId);
  }, [chatEnabled, initialRoomId, loadRoomHistory]);

  useEffect(() => {
    if (
      !open ||
      !chatEnabled ||
      mode !== 'chat' ||
      historyAttemptedRef.current
    ) {
      return;
    }

    const roomId = initialRoomId ?? getStoredRoomId(slug);
    if (!roomId) {
      setHistoryStatus('loaded');
      historyAttemptedRef.current = true;
      return;
    }

    historyAttemptedRef.current = true;
    void loadRoomHistory(roomId);
  }, [chatEnabled, initialRoomId, loadRoomHistory, mode, open, slug]);

  function startNewChat() {
    clearStoredRoomId(slug);
    setConversationId(null);
    setMessages([]);
    setHistoryStatus('loaded');
    historyAttemptedRef.current = true;
  }

  async function handleShareRoom() {
    if (!conversationId) return;

    const url = buildRoomShareUrl(slug, conversationId);

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const inputEl = document.createElement('input');
      inputEl.value = url;
      document.body.appendChild(inputEl);
      inputEl.select();
      document.execCommand('copy');
      document.body.removeChild(inputEl);
    }

    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 3000);
  }

  const saveMessage = useCallback(
    async (convId: string, role: 'user' | 'assistant', content: string) => {
      try {
        await fetch(`/api/chat/${slug}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: convId, role, content }),
        });
      } catch {
        // best-effort persistence
      }
    },
    [slug],
  );

  async function ensureConversation(email: string): Promise<string> {
    if (conversationId) return conversationId;

    const res = await fetch(`/api/chat/${slug}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: visitorIdRef.current,
        visitorEmail: email,
      }),
    });

    if (!res.ok) throw new Error('Failed to create conversation');

    const data = await res.json();
    setConversationId(data.id);
    setStoredRoomId(slug, data.id);
    return data.id;
  }

  const sendQuery = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query || loading) return;
      if (!visitorEmail) return; // Hard guard — gate UI should prevent this path.

      const cacheKey = `karte:chat:${slug}:${query}`;
      const cached =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(cacheKey)
          : null;
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: query }]);

      if (cached) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: cached },
        ]);
        return;
      }

      setLoading(true);

      try {
        const convId = await ensureConversation(visitorEmail);
        void saveMessage(convId, 'user', query);

        const res = await fetch(`/api/chat/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            visitorEmail,
            conversationId: convId,
          }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: 'Something went wrong' }));
          const errMsg =
            res.status === 429
              ? "You're sending messages too quickly. Please wait a moment and try again."
              : err.error || 'Something went wrong';
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: errMsg },
          ]);
          return;
        }

        // Streaming marker-protocol response:
        //   <text> <<<COMPONENTS>>> [json array]
        // The parser flushes plain text up until the marker boundary
        // (handling cross-chunk splits), then buffers the JSON tail.
        // Components materialize on stream-completion.
        const reader = res.body?.getReader();
        if (!reader) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'No response stream.' },
          ]);
          return;
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const decoder = new TextDecoder();
        const parser = createStreamParserState();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const flushed = feedChunk(parser, chunk);
          if (flushed) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + flushed,
                };
              }
              return updated;
            });
          }
        }

        const { flushedText, components, layout } = finishStream(parser);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + flushedText,
              components: components.length ? components : undefined,
              layout: layout ?? undefined,
            };
          }
          return updated;
        });

        const finalText = parser.text;
        if (finalText) {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(cacheKey, finalText);
          }
          void saveMessage(convId, 'assistant', finalText);
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && !last.content.trim()) {
              updated[updated.length - 1] = {
                ...last,
                content: EMPTY_CHAT_RESPONSE_MESSAGE,
                components: undefined,
                layout: undefined,
              };
              return updated;
            }
            return [
              ...updated,
              { role: 'assistant', content: EMPTY_CHAT_RESPONSE_MESSAGE },
            ];
          });
          void saveMessage(convId, 'assistant', EMPTY_CHAT_RESPONSE_MESSAGE);
        }
      } catch (err) {
        captureActionFailure(err, { action: 'chat_send' });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant' && !last.content.trim()) {
            updated[updated.length - 1] = {
              ...last,
              content: CHAT_SERVICE_UNAVAILABLE_MESSAGE,
              components: undefined,
              layout: undefined,
            };
            return updated;
          }
          return [
            ...updated,
            { role: 'assistant', content: CHAT_SERVICE_UNAVAILABLE_MESSAGE },
          ];
        });
      } finally {
        setLoading(false);
      }
    },
    [ensureConversation, loading, saveMessage, slug, visitorEmail],
  );

  // AskAgain chips fire 'karte:ask-again' on click; this hooks them
  // up to the chat send pipeline without leaking refs across the
  // component boundary.
  useEffect(() => {
    function onAskAgain(e: Event) {
      const detail = (e as CustomEvent).detail as
        | { question?: string }
        | undefined;
      const q = detail?.question;
      if (typeof q === 'string' && q.trim()) {
        void sendQuery(q);
      }
    }
    window.addEventListener('karte:ask-again', onAskAgain);
    return () => window.removeEventListener('karte:ask-again', onAskAgain);
  }, [sendQuery]);

  async function handleSend() {
    await sendQuery(input);
  }

  useEffect(() => {
    if (open) {
      trackEvent(slug, {
        eventType: 'hook_open',
        resourceType: 'widget',
        metadata: { mode },
      });
    }
  }, [open, slug]);

  useEffect(() => {
    if (open && mode === 'contact') {
      trackEvent(slug, {
        eventType: 'dm_start',
        resourceType: 'widget',
      });
    }
  }, [mode, open, slug]);

  useEffect(() => {
    function handleOpenWidget(event: Event) {
      const detail = (
        event as CustomEvent<{
          mode?: 'chat' | 'contact';
          prompt?: string;
          autoSend?: boolean;
        }>
      ).detail;
      const requestedMode = detail?.mode;
      const prompt = detail?.prompt?.trim();

      if (prompt) {
        trackEvent(slug, {
          eventType: 'chat_cta_click',
          resourceType: 'cta',
          resourceLabel: prompt,
          metadata: { autoSend: detail?.autoSend },
        });
      }

      if (requestedMode === 'contact' && dmEnabled) {
        setMode('contact');
      } else if (chatEnabled) {
        setMode('chat');
        if (prompt) {
          setInput(prompt);
          if (detail?.autoSend) {
            window.setTimeout(() => {
              void sendQuery(prompt);
            }, 0);
          }
        }
      } else if (dmEnabled) {
        setMode('contact');
      }

      setOpen(true);
    }

    window.addEventListener('karte:open-widget', handleOpenWidget);
    return () =>
      window.removeEventListener('karte:open-widget', handleOpenWidget);
  }, [chatEnabled, dmEnabled, sendQuery, slug]);

  const launcherPositionClass =
    position === 'bottom-left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6';
  const panelPositionClass = expanded
    ? 'left-3 right-3 sm:left-1/2 sm:right-auto sm:w-[min(760px,calc(100vw-3rem))] sm:-translate-x-1/2'
    : position === 'bottom-left'
      ? 'left-3 right-3 sm:right-auto sm:left-6 sm:w-[380px]'
      : 'left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px]';
  const panelHeightClass = expanded
    ? 'h-[min(780px,calc(100vh-4.5rem))] sm:h-[min(780px,calc(100vh-3rem))]'
    : 'h-[min(520px,calc(100vh-6rem))]';
  const showModeTabs = chatEnabled && dmEnabled;
  const title =
    mode === 'chat' ? `Chat with ${displayName}` : `DM ${displayName}`;

  if (!chatEnabled && !dmEnabled) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-4 ${launcherPositionClass} z-50 flex h-14 w-14 items-center justify-center rounded-full border border-karte-border-strong text-2xl backdrop-blur-xl transition-all duration-200 ease-[var(--karte-ease)] hover:scale-105 active:scale-95 sm:bottom-6`}
        aria-label={open ? 'Close messenger' : 'Open messenger'}
        style={{
          backgroundColor: `${accentColor}f2`,
          boxShadow: `0 18px 44px -18px ${accentColor}`,
          color: accentTextColor,
        }}
      >
        {open ? '\u2715' : '\uD83D\uDCAC'}
      </button>

      {open && (
        <div
          className={`fixed bottom-20 ${panelPositionClass} ${panelHeightClass} z-50 flex w-auto flex-col overflow-hidden rounded-2xl border border-karte-border-strong bg-karte-surface/95 backdrop-blur-xl transition-[height,width,transform] duration-200 ease-[var(--karte-ease)] sm:bottom-24 ${expanded ? 'sm:bottom-6' : ''}`}
        >
          <div className="border-b border-karte-border-strong px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-karte-text">{title}</h3>
              <div className="flex items-center gap-2">
                {!!initialRoomId && (
                  <span className="rounded-full border border-karte-border-strong bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
                    Invited via link
                  </span>
                )}
                {mode === 'chat' &&
                  chatEnabled &&
                  conversationId &&
                  !isGuestPreview && (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleShareRoom()}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          shareCopied
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-karte-border-strong text-white/70 hover:text-karte-text'
                        }`}
                        aria-label="Copy invite link to this chat"
                      >
                        {shareCopied ? '✓ Link copied' : 'Share'}
                      </button>
                      <button
                        type="button"
                        onClick={startNewChat}
                        className="rounded-full border border-karte-border-strong px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:text-karte-text"
                        aria-label="Start a new chat"
                      >
                        New
                      </button>
                    </>
                  )}
                {showModeTabs && (
                  <div className="flex rounded-full border border-karte-border-strong bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('chat')}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        mode === 'chat'
                          ? 'bg-white text-gray-900'
                          : 'text-white/70 hover:text-karte-text'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('contact')}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        mode === 'contact'
                          ? 'bg-white text-gray-900'
                          : 'text-white/70 hover:text-karte-text'
                      }`}
                    >
                      DM
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded((current) => !current)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-karte-text"
                  aria-label={expanded ? 'Shrink chat' : 'Expand chat'}
                  title={expanded ? 'Shrink chat' : 'Expand chat'}
                >
                  {expanded ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M8 3v5H3" />
                      <path d="M16 21v-5h5" />
                      <path d="M3 8l6-6" />
                      <path d="M21 16l-6 6" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M9 21H3v-6" />
                      <path d="M21 3l-7 7" />
                      <path d="M3 21l7-7" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-karte-text"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>
            </div>
            {mode === 'chat' && chatEnabled && conversationId && (
              <p
                className={`mt-1.5 text-[10px] leading-4 transition-colors ${shareCopied ? 'text-emerald-400/60' : 'text-white/25'}`}
              >
                {shareCopied
                  ? "Paste that link anywhere to invite someone — they'll see the full conversation."
                  : 'Anyone with the link can read this room · no expiry · avoid sensitive info'}
              </p>
            )}
          </div>

          {mode === 'chat' && chatEnabled ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {historyStatus === 'loading' && (
                  <div className="mt-8 flex justify-center">
                    <div
                      className={`${expanded ? 'max-w-[92%]' : 'max-w-[80%]'} rounded-xl border border-karte-border-strong bg-white/5 px-3 py-2 text-sm`}
                    >
                      <ChatLoadingIndicator label="Loading messages" />
                    </div>
                  </div>
                )}
                {historyStatus === 'error' && messages.length === 0 && (
                  <p className="mt-8 text-center text-xs text-white/50">
                    Couldn&apos;t load this chat room. Start a new conversation
                    below.
                  </p>
                )}
                {historyStatus !== 'loading' &&
                  messages.length === 0 &&
                  historyStatus !== 'error' && (
                    <div className="mt-4 flex flex-col items-center gap-4 px-2 text-center sm:mt-8">
                      <div className="text-5xl sm:text-4xl">👋</div>
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold text-karte-text sm:text-sm">
                          Ask {displayName} anything
                        </p>
                        <p className="text-sm leading-5 text-white/60 sm:text-xs">
                          Tap a question below or type your own — you&apos;ll
                          get an answer in seconds.
                        </p>
                      </div>
                      <div className="flex w-full flex-wrap justify-center gap-2 pt-1">
                        {starterPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleStarterPrompt(prompt)}
                            className="rounded-full border border-karte-border-emphasis bg-white/10 px-3 py-2 text-sm text-white/90 transition hover:bg-white/15 active:scale-95 sm:py-1.5 sm:text-xs"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] leading-4 text-white/25">
                        Anyone with the invite link can read this room · Rooms
                        don&apos;t expire · Avoid sharing sensitive info
                      </p>
                    </div>
                  )}
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`${expanded ? 'max-w-[92%]' : 'max-w-[80%]'} whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? ''
                          : 'border border-karte-border-strong bg-white/5 text-white/90'
                      }`}
                      style={
                        msg.role === 'user'
                          ? {
                              backgroundColor: accentColor,
                              color: accentTextColor,
                            }
                          : undefined
                      }
                    >
                      {msg.content === '' &&
                      loading &&
                      index === messages.length - 1 ? (
                        <ChatLoadingIndicator label="Thinking" />
                      ) : msg.role === 'assistant' ? (
                        <>
                          <ChatMessageBody content={msg.content} />
                          {msg.components &&
                            msg.components.length > 0 &&
                            (() => {
                              const {
                                components: ordered,
                                density,
                                moodStyle,
                              } = applyLayoutDirectives(
                                msg.components,
                                msg.layout,
                              );
                              if (ordered.length === 0) return null;
                              const gap =
                                density === 'compact'
                                  ? 'mt-1.5 space-y-1.5'
                                  : density === 'magazine'
                                    ? 'mt-3 space-y-4'
                                    : 'mt-2 space-y-2';
                              return (
                                <div className={gap} style={moodStyle}>
                                  {ordered.map((c, i) =>
                                    renderComponent(c, i, i),
                                  )}
                                </div>
                              );
                            })()}
                        </>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {showPendingAssistant && (
                  <div className="flex justify-start">
                    <div
                      className={`${expanded ? 'max-w-[92%]' : 'max-w-[80%]'} rounded-xl border border-karte-border-strong bg-white/5 px-3 py-2 text-sm`}
                    >
                      <ChatLoadingIndicator label="Thinking" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {isGuestPreview ? (
                <div className="border-t border-karte-border-strong px-4 py-4 text-center">
                  <p className="mb-3 text-xs text-white/50">
                    You&apos;re previewing a shared conversation
                  </p>
                  <button
                    type="button"
                    onClick={handleJoinChat}
                    className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:brightness-110"
                    style={{
                      backgroundColor: accentColor,
                      color: accentTextColor,
                    }}
                  >
                    Join chat
                  </button>
                </div>
              ) : emailHydrated && !visitorEmail ? (
                <ChatEmailGate
                  displayName={displayName}
                  accentColor={accentColor}
                  accentTextColor={accentTextColor}
                  onSubmit={handleEmailCaptured}
                />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSend();
                  }}
                  className={`border-t px-4 py-3 transition-colors ${
                    isFirstMessage
                      ? 'border-white/25 bg-white/[0.04]'
                      : 'border-karte-border-strong'
                  }`}
                >
                  {isFirstMessage && (
                    <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-white/60 sm:hidden">
                      Type your first message ↓
                    </p>
                  )}
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      rows={1}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder={
                        isFirstMessage
                          ? `Ask ${displayName} a question…`
                          : 'Type a message...'
                      }
                      disabled={loading || historyStatus === 'loading'}
                      className={`min-w-0 flex-1 resize-none rounded-lg border bg-white/5 px-3 py-3 text-base leading-5 text-karte-text placeholder-white/40 outline-none transition focus:border-[#f2c879] sm:py-2 sm:text-sm ${
                        isFirstMessage
                          ? 'border-white/30 ring-1 ring-white/15 focus:ring-2 focus:ring-[#f2c879]/40'
                          : 'border-karte-border-strong'
                      }`}
                      style={{ maxHeight: '96px', overflowY: 'auto' }}
                    />
                    <button
                      type="submit"
                      disabled={
                        loading || historyStatus === 'loading' || !input.trim()
                      }
                      className={`flex shrink-0 items-center justify-center gap-1.5 self-end rounded-lg border border-black/10 px-4 py-3 text-base font-medium transition-opacity duration-200 ease-[var(--karte-ease)] disabled:opacity-40 sm:px-3 sm:py-2 sm:text-sm ${
                        isFirstMessage && input.trim() ? 'animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor: accentColor,
                        color: accentTextColor,
                      }}
                      aria-label="Send message"
                    >
                      <span>Send</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1.5 hidden text-[10px] text-white/25 sm:block">
                    Enter to send · Shift+Enter for newline
                  </p>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-4 text-sm text-white/70">
                Send a direct message to {displayName}.
              </p>
              {dmMode === 'anonymous' && (
                <p className="mb-4 text-xs leading-5 text-white/50">
                  This profile accepts anonymous messages.
                </p>
              )}
              {dmMode === 'email' && (
                <p className="mb-4 text-xs leading-5 text-white/50">
                  This profile requires a verified email before sending.
                </p>
              )}
              <ContactFormSection
                slug={slug}
                accentColor={accentColor}
                compact
                dmMode={dmMode === 'anonymous' ? 'anonymous' : 'email'}
                requireVerifiedEmail={dmMode === 'email'}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
