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
      const res = await fetch(
        `/api/pages/${pageId}/submissions/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );

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
      <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
        <p className="text-gray-400">
          No messages yet. Direct messages and contact submissions will show here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {archivedCount > 0 && (
        <p className="text-xs text-gray-500">
          {archivedCount} archived message{archivedCount === 1 ? '' : 's'} hidden.
        </p>
      )}

      {visibleMessages.map((message) => {
        const isAnonymous = message.senderType === 'anonymous';
        const isUpdating = updatingId === message.id;

        return (
          <div
            key={message.id}
            className="rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-white">
                    {message.name}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      isAnonymous
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-green-400/10 text-green-300'
                    }`}
                  >
                    {isAnonymous ? 'Anonymous' : 'Email-verified'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      message.status === 'replied'
                        ? 'bg-blue-400/10 text-blue-300'
                        : 'bg-cyan-300/10 text-cyan-200'
                    }`}
                  >
                    {message.status === 'replied' ? 'Replied' : 'Unread'}
                  </span>
                </div>
                {isAnonymous ? (
                  <p className="mt-1 text-sm text-gray-400">No email attached</p>
                ) : (
                  <a
                    href={`mailto:${message.email}`}
                    className="mt-1 inline-flex text-sm text-blue-300 hover:text-blue-200"
                  >
                    {message.email}
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatCreatedAt(message.createdAt)}
              </p>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-300">
              {message.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {message.status !== 'unread' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void updateStatus(message.id, 'unread')}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Mark Unread
                </button>
              )}
              {message.status !== 'replied' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void updateStatus(message.id, 'replied')}
                  className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-medium text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-50"
                >
                  Mark Replied
                </button>
              )}
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void updateStatus(message.id, 'archived')}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
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
