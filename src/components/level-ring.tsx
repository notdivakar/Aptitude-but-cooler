export function LevelRing({ level, xpInLevel, xpNeeded, size = 108 }: { level: number; xpInLevel: number; xpNeeded: number; size?: number }) {
  const r = (size - 14) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0.02, Math.min(1, xpInLevel / Math.max(xpNeeded, 1)));
  const dash = circumference * pct;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B7CFB" />
            <stop offset="100%" stopColor="#F4B740" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="7" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[10px] text-mute tracking-wider">LEVEL</span>
        <span className="font-display font-extrabold text-3xl text-ink leading-none">{level}</span>
      </div>
    </div>
  );
}
