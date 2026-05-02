'use client';

type WidgetMode = 'chat' | 'contact';

export function OpenChatButton({
  mode = 'chat',
  children,
  className = '',
  style,
}: {
  mode?: WidgetMode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => {
        window.dispatchEvent(new CustomEvent('linkchat:open-widget', { detail: { mode } }));
      }}
    >
      {children}
    </button>
  );
}
