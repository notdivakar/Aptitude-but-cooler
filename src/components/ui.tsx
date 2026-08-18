export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-surface border border-border rounded-card ${className}`}>{children}</div>;
}

export function Bar({ value, max, colorClass = "bg-violet", height = 10 }: { value: number; max: number; colorClass?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <div className="rounded-full bg-white/5 overflow-hidden" style={{ height }}>
      <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
