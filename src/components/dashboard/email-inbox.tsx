'use client';

import { useState } from 'react';
import sanitizeHtml from 'sanitize-html';

type EmailMessage = {
  id: string;
  fromAddress: string;
  fromName: string | null;
  subject: string | null;
  textPreview: string | null;
  status: 'unread' | 'read' | 'deleted';
  receivedAt: Date | string | null;
  readAt: Date | string | null;
  hasBody: boolean;
};

type EmailInboxProps = {
  pageId: string;
  slug: string;
  emailInboxEnabled: boolean;
  unreadCount: number;
  initialMessages: EmailMessage[];
};

function formatDate(value: Date | string | null): string {
  if (!value) return '';
  return value instanceof Date
    ? value.toLocaleString()
    : new Date(value).toLocaleString();
}

export function EmailInbox({
  pageId,
  slug,
  emailInboxEnabled,
  initialMessages,
}: EmailInboxProps) {
  const [enabled, setEnabled] = useState(emailInboxEnabled);
  const [enabling, setEnabling] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openBody, setOpenBody] = useState<{
    text: string | null;
    html: string | null;
  } | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function toggleInbox(next: boolean) {
    setEnabling(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailInboxEnabled: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setEnabling(false);
    }
  }

  async function openMessage(message: EmailMessage) {
    if (openId === message.id) {
      setOpenId(null);
      setOpenBody(null);
      return;
    }
    setOpenId(message.id);
    setOpenBody(null);
    setLoadingBody(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/emails/${message.id}`);
      if (res.ok) {
        const data = await res.json();
        setOpenBody({ text: data.text, html: data.html });
        setMessages((current) =>
          current.map((m) =>
            m.id === message.id ? { ...m, status: 'read' } : m,
          ),
        );
      }
    } finally {
      setLoadingBody(false);
    }
  }

  async function deleteMessage(message: EmailMessage) {
    setDeletingId(message.id);
    try {
      const res = await fetch(`/api/pages/${pageId}/emails/${message.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages((current) => current.filter((m) => m.id !== message.id));
        if (openId === message.id) {
          setOpenId(null);
          setOpenBody(null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  function copyAddress() {
    const addr = `${slug}@karte.cc`;
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const emailAddress = `${slug}@karte.cc`;
  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-6">
      {/* Enable toggle + address display */}
      <div className="rounded-2xl bg-white/[0.02] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-karte-text">
              Inbound email address
            </p>
            {enabled ? (
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded-lg border border-karte-border-emphasis bg-white/5 px-3 py-1.5 font-mono text-sm text-karte-text">
                  {emailAddress}
                </code>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="rounded-lg border border-karte-border-emphasis bg-white/5 px-3 py-1.5 text-xs font-medium text-karte-text-2 transition hover:bg-white/10"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-xs leading-5 text-karte-text-3">
                Enable to activate {emailAddress}. Mail is stored here and a
                short notification is sent to your real inbox.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={enabling}
            onClick={() => void toggleInbox(!enabled)}
            className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              enabled
                ? 'border-karte-border-emphasis bg-white/5 text-karte-text-2 hover:bg-white/10'
                : 'border-karte-accent/30 bg-karte-accent/10 text-karte-accent-soft hover:bg-karte-accent/15'
            }`}
          >
            {enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
        {enabled && (
          <p className="mt-3 text-xs leading-5 text-karte-text-4">
            Messages are capped at 50 stored per page. Your account email gets a
            short notification, not the full original message. Spam filtering is
            handled by Cloudflare Email Routing (SPF/DMARC).
          </p>
        )}
      </div>

      {enabled && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.025] p-6">
              <p className="text-sm text-white/70">Total messages</p>
              <p className="mt-2 text-3xl font-bold text-karte-text">
                {messages.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.025] p-6">
              <p className="text-sm text-white/70">Unread</p>
              <p className="mt-2 text-3xl font-bold text-karte-text">
                {unreadCount}
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
              <p className="text-karte-text-3">
                No mail yet. Send a test email to {emailAddress} to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOpen = openId === message.id;
                const isUnread = message.status === 'unread';
                return (
                  <div
                    key={message.id}
                    className="rounded-2xl bg-white/[0.025] p-5 transition hover:bg-white/[0.04]"
                  >
                    <button
                      type="button"
                      onClick={() => void openMessage(message)}
                      className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-base ${isUnread ? 'font-semibold text-karte-text' : 'font-medium text-karte-text-2'}`}
                          >
                            {message.subject || '(no subject)'}
                          </p>
                          {isUnread && (
                            <span className="rounded-full bg-karte-accent/10 px-2.5 py-1 text-[11px] font-medium text-karte-accent-soft">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-karte-text-3">
                          {message.fromName
                            ? `${message.fromName} <${message.fromAddress}>`
                            : message.fromAddress}
                        </p>
                        {message.textPreview && !isOpen && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-karte-text-4">
                            {message.textPreview}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-xs text-karte-text-4">
                        {formatDate(message.receivedAt)}
                      </p>
                    </button>

                    {isOpen && (
                      <div className="mt-4 border-t border-karte-border-strong pt-4">
                        {loadingBody && (
                          <p className="text-sm text-karte-text-3">
                            Loading body…
                          </p>
                        )}
                        {openBody && !loadingBody && (
                          <MessageBody
                            text={openBody.text}
                            html={openBody.html}
                          />
                        )}
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            disabled={deletingId === message.id}
                            onClick={() => void deleteMessage(message)}
                            className="rounded-lg border border-karte-border-emphasis bg-white/5 px-3 py-2 text-xs font-medium text-karte-text-2 transition hover:bg-white/10 disabled:opacity-50"
                          >
                            {deletingId === message.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MessageBody({
  text,
  html,
}: {
  text: string | null;
  html: string | null;
}) {
  if (html) {
    const clean = sanitizeHtml(html, {
      allowedTags: [
        'p',
        'br',
        'strong',
        'em',
        'a',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'hr',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'div',
        'span',
        'pre',
        'code',
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'alt', 'width', 'height'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
    return (
      <div
        className="prose prose-invert max-w-none text-sm leading-6 text-karte-text-2 [&_a]:text-karte-accent-soft [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }
  if (text) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-karte-text-2">
        {text}
      </pre>
    );
  }
  return (
    <p className="text-sm text-karte-text-4">
      No body stored for this message.
    </p>
  );
}
