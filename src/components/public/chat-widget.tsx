'use client';

import { useCallback,useEffect, useRef, useState } from 'react';

import { ContactFormSection } from '@/components/public/contact-form-section';
import type { DmMode } from '@/db/schema';
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
}: {
  slug: string;
  displayName: string;
  accentColor?: string;
  position?: ChatPosition;
  chatEnabled?: boolean;
  dmMode?: DmMode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'contact'>(chatEnabled ? 'chat' : 'contact');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visitorIdRef = useRef<string | null>(null);
  const accentTextColor = getButtonTextColor(accentColor);
  const dmEnabled = dmMode !== 'off';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    function handleOpenWidget(event: Event) {
      const detail = (event as CustomEvent<{ mode?: 'chat' | 'contact' }>).detail;
      const requestedMode = detail?.mode;

      if (requestedMode === 'contact' && dmEnabled) {
        setMode('contact');
      } else if (chatEnabled) {
        setMode('chat');
      } else if (dmEnabled) {
        setMode('contact');
      }

      setOpen(true);
    }

    window.addEventListener('linkchat:open-widget', handleOpenWidget);
    return () => window.removeEventListener('linkchat:open-widget', handleOpenWidget);
  }, [chatEnabled, dmEnabled]);

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
    return data.id;
  }

  async function handleSend() {
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
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
        void saveMessage(convId, 'assistant', fullResponse);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Failed to connect to chat service' },
      ]);
    } finally {
      setLoading(false);
    }
  }

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

          {mode === 'chat' && chatEnabled ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <p className="mt-8 text-center text-xs text-white/40">
                    Ask anything about {displayName}
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
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[#f2c879]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
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
