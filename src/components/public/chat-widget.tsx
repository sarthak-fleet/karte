'use client';

import { useCallback,useEffect, useRef, useState } from 'react';

import { ContactFormSection } from '@/components/public/contact-form-section';
import type { DmMode } from '@/db/schema';
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
}

type ChatPosition = 'bottom-right' | 'bottom-left';

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
  initialRoomId = null,
}: {
  slug: string;
  displayName: string;
  accentColor?: string;
  position?: ChatPosition;
  chatEnabled?: boolean;
  dmMode?: DmMode;
  initialRoomId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const prevOpenRef = useRef(false);
  const [mode, setMode] = useState<'chat' | 'contact'>(chatEnabled ? 'chat' : 'contact');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState<
    'idle' | 'loading' | 'error' | 'loaded'
  >('idle');
  const [shareCopied, setShareCopied] = useState(false);
  const historyAttemptedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visitorIdRef = useRef<string | null>(null);
  const accentTextColor = getButtonTextColor(accentColor);
  const dmEnabled = dmMode !== 'off';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!open || !chatEnabled || mode !== 'chat' || historyAttemptedRef.current) {
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
    window.setTimeout(() => setShareCopied(false), 2000);
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

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;

    const res = await fetch(`/api/chat/${slug}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: visitorIdRef.current }),
    });

    if (!res.ok) throw new Error('Failed to create conversation');

    const data = await res.json();
    setConversationId(data.id);
    setStoredRoomId(slug, data.id);
    return data.id;
  }

  const sendQuery = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query || loading) return;

    const cacheKey = `linkchat:chat:${slug}:${query}`;
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);

    if (cached) {
      setMessages((prev) => [...prev, { role: 'assistant', content: cached }]);
      return;
    }

    setLoading(true);

    try {
      const convId = await ensureConversation();
      void saveMessage(convId, 'user', query);

      const res = await fetch(`/api/chat/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong' }));
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: err.error || 'Something went wrong' },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'No response stream' },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }

      if (fullResponse) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(cacheKey, fullResponse);
        }
        void saveMessage(convId, 'assistant', fullResponse);
      }
    } catch (err) {
      captureActionFailure(err, { action: 'chat_send' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Couldn't reach the chat service. Check your connection and try sending again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [ensureConversation, loading, saveMessage, slug]);

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
      const detail = (event as CustomEvent<{
        mode?: 'chat' | 'contact';
        prompt?: string;
        autoSend?: boolean;
      }>).detail;
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

    window.addEventListener('linkchat:open-widget', handleOpenWidget);
    return () => window.removeEventListener('linkchat:open-widget', handleOpenWidget);
  }, [chatEnabled, dmEnabled, sendQuery, slug]);

  const launcherPositionClass =
    position === 'bottom-left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6';
  const panelPositionClass =
    position === 'bottom-left'
      ? 'left-3 right-3 sm:right-auto sm:left-6 sm:w-[380px]'
      : 'left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px]';
  const showModeTabs = chatEnabled && dmEnabled;
  const title = mode === 'chat' ? `Chat with ${displayName}` : `DM ${displayName}`;

  if (!chatEnabled && !dmEnabled) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-4 ${launcherPositionClass} z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-2xl shadow-lg backdrop-blur-xl transition-transform hover:scale-110 active:scale-95 sm:bottom-6`}
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
          className={`fixed bottom-20 ${panelPositionClass} z-50 flex h-[min(520px,calc(100vh-6rem))] w-auto flex-col overflow-hidden rounded-2xl border border-white/20 bg-gray-900/80 shadow-2xl backdrop-blur-xl sm:bottom-24`}
        >
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">
                {title}
              </h3>
              <div className="flex items-center gap-2">
                {mode === 'chat' && chatEnabled && conversationId && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleShareRoom()}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:text-white"
                      aria-label="Copy invite link to this chat"
                    >
                      {shareCopied ? 'Copied!' : 'Share'}
                    </button>
                    <button
                      type="button"
                      onClick={startNewChat}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:text-white"
                      aria-label="Start a new chat"
                    >
                      New
                    </button>
                  </>
                )}
                {showModeTabs && (
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('chat')}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        mode === 'chat'
                          ? 'bg-white text-gray-900'
                          : 'text-white/70 hover:text-white'
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
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      DM
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {mode === 'chat' && chatEnabled ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {historyStatus === 'loading' && (
                  <p className="mt-8 text-center text-xs text-white/50">
                    Loading your conversation...
                  </p>
                )}
                {historyStatus === 'error' && messages.length === 0 && (
                  <p className="mt-8 text-center text-xs text-white/50">
                    Couldn&apos;t load this chat room. Start a new conversation below.
                  </p>
                )}
                {historyStatus !== 'loading' &&
                  messages.length === 0 &&
                  historyStatus !== 'error' && (
                    <p className="mt-8 text-center text-xs text-white/40">
                      Ask anything about {displayName}. Your chat saves automatically and
                      can be shared with an invite link.
                    </p>
                  )}
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? ''
                          : 'border border-white/10 bg-white/5 text-white/90'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { backgroundColor: accentColor, color: accentTextColor }
                          : undefined
                      }
                    >
                      {msg.content || (loading && index === messages.length - 1 ? '...' : '')}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading || historyStatus === 'loading'}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[#f2c879]"
                />
                <button
                  type="submit"
                  disabled={loading || historyStatus === 'loading' || !input.trim()}
                  className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: accentColor, color: accentTextColor }}
                >
                  Send
                </button>
              </form>
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
