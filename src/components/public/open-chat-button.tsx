'use client';

import { useParams } from 'next/navigation';

import { getOrCreateVisitorId } from '@/lib/visitor-id';

type WidgetMode = 'chat' | 'contact';

export function OpenChatButton({
  mode = 'chat',
  prompt,
  autoSend = false,
  children,
  className = '',
  style,
}: {
  mode?: WidgetMode;
  prompt?: string;
  autoSend?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : null;

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => {
        if (slug) {
          void fetch(`/api/track/${slug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'chat_cta_click',
              visitorId: getOrCreateVisitorId(),
              resourceType: 'chat_cta',
              resourceLabel:
                typeof children === 'string' ? children : prompt || mode,
              metadata: { prompt, autoSend, mode },
            }),
            keepalive: true,
          });
        }

        window.dispatchEvent(
          new CustomEvent('karte:open-widget', {
            detail: { mode, prompt, autoSend },
          }),
        );
      }}
    >
      {children}
    </button>
  );
}
