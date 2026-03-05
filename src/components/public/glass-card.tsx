export function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
