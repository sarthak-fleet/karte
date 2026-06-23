'use client';

import { useState } from 'react';

import type { contactSubmissions } from '@/db/schema';

type InboxMessage = typeof contactSubmissions.$inferSelect;
type InboxStatus = InboxMessage['status'];

type InboxMessageListProps = {
  pageId: string;
  initialMessages: InboxMessage[];
};

function formatCreatedAt(value: InboxMessage['createdAt']) {
  if (!value) {
    return 'Just now';
  }

  return value instanceof Date
    ? value.toLocaleString()
    : new Date(value).toLocaleString();
}

export function InboxMessageList({
  pageId,
  initialMessages,
}: InboxMessageListProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(messageId: string, status: InboxStatus) {
    setUpdatingId(messageId);

    try {
      const res = await fetch(`/api/pages/${pageId}/submissions/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, status } : message,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleMessages = messages.filter(
    (message) => message.status !== 'archived',
  );
  const archivedCount = messages.length - visibleMessages.length;

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
        <p className="text-karte-text-3">
          No messages yet. Direct messages and contact submissions will show
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {archivedCount > 0 && (
        <p className="text-xs text-karte-text-4">
          {archivedCount} archived message{archivedCount === 1 ? '' : 's'}{' '}
          hidden.
        </p>
      )}

      {visibleMessages.map((message) => {
        const isAnonymous = message.senderType === 'anonymous';
        const isUpdating = updatingId === message.id;

        return (
          <div
            key={message.id}
            className="rounded-2xl bg-white/[0.025] p-5 transition hover:bg-white/[0.04]"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-karte-text">
                    {message.name}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      isAnonymous
                        ? 'bg-white/10 text-karte-text-2'
                        : 'bg-green-400/10 text-green-300'
                    }`}
                  >
                    {isAnonymous ? 'Anonymous' : 'Email-verified'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      message.status === 'replied'
                        ? 'bg-green-400/10 text-green-300'
                        : 'bg-karte-accent/10 text-karte-accent-soft'
                    }`}
                  >
                    {message.status === 'replied' ? 'Replied' : 'Unread'}
                  </span>
                </div>
                {isAnonymous ? (
                  <p className="mt-1 text-sm text-karte-text-3">
                    No email attached
                  </p>
                ) : (
                  <a
                    href={`mailto:${message.email}`}
                    className="mt-1 inline-flex text-sm text-karte-accent-soft transition-colors duration-150 hover:text-karte-accent"
                  >
                    {message.email}
                  </a>
                )}
              </div>
              <p className="text-xs text-karte-text-4">
                {formatCreatedAt(message.createdAt)}
              </p>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-karte-text-2">
              {message.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-karte-border-strong pt-4">
              {message.status !== 'unread' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void updateStatus(message.id, 'unread')}
                  className="rounded-lg border border-karte-border-emphasis bg-white/5 px-3 py-2 text-xs font-medium text-karte-text transition hover:bg-white/10 disabled:opacity-50"
                >
                  Mark Unread
                </button>
              )}
              {message.status !== 'replied' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void updateStatus(message.id, 'replied')}
                  className="rounded-lg border border-green-400/20 bg-green-400/10 px-3 py-2 text-xs font-medium text-green-200 transition-colors duration-150 hover:border-green-400/30 hover:bg-green-400/15 disabled:opacity-50"
                >
                  Mark Replied
                </button>
              )}
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void updateStatus(message.id, 'archived')}
                className="rounded-lg border border-karte-border-emphasis bg-white/5 px-3 py-2 text-xs font-medium text-karte-text-2 transition hover:bg-white/10 disabled:opacity-50"
              >
                Archive
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
