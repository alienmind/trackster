export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" className={className}>
      <defs>
        <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="chipBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="chipRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="chipYellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
        </filter>
        <filter id="lightShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2"/>
        </filter>
      </defs>

      <g transform="translate(320, 40)">
        <rect x="0" y="0" width="160" height="160" rx="20" fill="url(#boardGrad)" filter="url(#shadow)" stroke="#15803d" strokeWidth="4"/>
        
        <circle cx="20" cy="20" r="6" fill="#14532d" />
        <circle cx="140" cy="20" r="6" fill="#14532d" />
        <circle cx="20" cy="140" r="6" fill="#14532d" />
        <circle cx="140" cy="140" r="6" fill="#14532d" />
        
        <path d="M 60 20 L 60 40 M 80 20 L 80 40 M 100 20 L 100 40" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 20 60 L 40 60 M 20 80 L 40 80 M 20 100 L 40 100" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 60 120 L 60 140 M 80 120 L 80 140 M 100 120 L 100 140" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/>
        
        <path d="M 40 120 L 20 100" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 120 40 L 140 60" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/>

        <circle cx="25" cy="110" r="5" fill="#ef4444" />
        <circle cx="35" cy="125" r="5" fill="#3b82f6" />
        <circle cx="50" cy="140" r="5" fill="#facc15" />
        <circle cx="140" cy="50" r="5" fill="#4ade80" />
        <circle cx="130" cy="80" r="5" fill="#3b82f6" />

        <path d="M 110 80 L 130 80" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/>

        <rect x="40" y="40" width="60" height="60" rx="8" fill="url(#chipBlue)" filter="url(#lightShadow)"/>
        <rect x="110" y="30" width="30" height="30" rx="6" fill="url(#chipRed)" filter="url(#lightShadow)"/>
        <rect x="100" y="80" width="40" height="40" rx="6" fill="url(#chipYellow)" filter="url(#lightShadow)"/>
      </g>

      <g transform="translate(100, 300)">
        <rect x="0" y="0" width="36" height="36" rx="6" fill="#f97316" stroke="currentColor" strokeWidth="6"/>
        <rect x="36" y="0" width="36" height="36" rx="6" fill="#3b82f6" stroke="currentColor" strokeWidth="6"/>
        <rect x="72" y="0" width="36" height="36" rx="6" fill="#facc15" stroke="currentColor" strokeWidth="6"/>
        <rect x="36" y="36" width="36" height="36" rx="6" fill="#22c55e" stroke="currentColor" strokeWidth="6"/>
        <rect x="36" y="72" width="36" height="36" rx="6" fill="#f97316" stroke="currentColor" strokeWidth="6"/>

        <text x="120" y="95" fontFamily="system-ui, -apple-system, sans-serif" fontSize="110" fontWeight="900" letterSpacing="-2" fill="currentColor">racks(ter)</text>
      </g>
    </svg>
  );
}
