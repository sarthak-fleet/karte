'use client';

import { useEffect, useState } from 'react';

interface Conversation {
  id: string;
  visitorId: string | null;
  createdAt: string;
  messageCount: number;
  firstMessage: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export function ChatList({ pageId }: { pageId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/conversations`)
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageId]);

  async function toggleConversation(convId: string) {
    if (expandedId === convId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(convId);

    if (!messagesMap[convId]) {
      setLoadingMessages(convId);
      try {
        const res = await fetch(`/api/pages/${pageId}/conversations/${convId}`);
        const msgs = await res.json();
        setMessagesMap((prev) => ({ ...prev, [convId]: msgs }));
      } catch {
        // silently fail
      } finally {
        setLoadingMessages(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
        <p className="text-karte-text-3">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
        <p className="text-karte-text-3">
          No conversations yet. Visitors will appear here once they start
          chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((convo) => (
        <div
          key={convo.id}
          className="rounded-2xl bg-white/[0.025] overflow-hidden transition hover:bg-white/[0.04]"
        >
          {/* Conversation header */}
          <button
            onClick={() => toggleConversation(convo.id)}
            className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-karte-text truncate">
                {convo.firstMessage || 'No messages'}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-karte-text-4">
                <span>
                  {new Date(convo.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>
                  {convo.messageCount} message
                  {convo.messageCount !== 1 ? 's' : ''}
                </span>
                {convo.visitorId && (
                  <span>{convo.visitorId.slice(0, 8)}...</span>
                )}
              </div>
            </div>
            <span className="text-sm text-karte-text-4 sm:ml-3">
              {expandedId === convo.id ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {/* Expanded messages */}
          {expandedId === convo.id && (
            <div className="max-h-96 space-y-3 overflow-y-auto border-t border-karte-border-strong px-4 py-4 sm:px-5">
              {loadingMessages === convo.id ? (
                <p className="text-xs text-karte-text-4">Loading messages...</p>
              ) : (
                (messagesMap[convo.id] || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-[1.5] sm:max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-karte-accent/15 text-karte-text ring-1 ring-karte-accent/25'
                          : 'border border-karte-border-strong bg-white/[0.03] text-karte-text-2'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {!loadingMessages &&
                (messagesMap[convo.id] || []).length === 0 && (
                  <p className="text-xs text-karte-text-4">
                    No messages in this conversation.
                  </p>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
