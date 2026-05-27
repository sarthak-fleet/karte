'use client';

import { useState } from 'react';

import { OpenChatButton } from '@/components/public/open-chat-button';

/**
 * Sticky inline "Ask anything" input that lives in the hero column.
 * It doesn't actually send — clicking the field or pressing Enter
 * opens the full chat widget pre-filled with the typed query. This
 * keeps the chat feel always-on without forcing visitors to find
 * the floating button.
 */
export function HeroChatDock({
  displayName,
  accentColor,
  chatEnabled,
}: {
  displayName: string;
  accentColor: string;
  chatEnabled: boolean;
}) {
  const [draft, setDraft] = useState('');
  if (!chatEnabled) return null;

  const firstName = displayName.split(/\s+/)[0] || displayName;

  return (
    <div
      className="mt-7 rounded-2xl border bg-white/[0.025] p-3 backdrop-blur-xl"
      style={{ borderColor: `${accentColor}28` }}
    >
      <p className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        <span style={{ color: accentColor }}>·</span> Ask {firstName} anything
      </p>
      <OpenChatButton
        mode="chat"
        prompt={draft.trim() || undefined}
        autoSend={!!draft.trim()}
        className="block w-full"
      >
        <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3.5 py-3 text-left text-[14px] text-karte-text transition-colors duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.08]">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={`What is ${firstName} building?`}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-karte-text-4"
          />
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-zinc-950 transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5"
            style={{ backgroundColor: accentColor }}
          >
            →
          </span>
        </span>
      </OpenChatButton>
    </div>
  );
}
