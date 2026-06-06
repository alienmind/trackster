export default function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" className={className}>
      <rect x="0" y="0" width="36" height="36" rx="6" fill="#f97316" stroke="currentColor" strokeWidth="6"/>
      <rect x="36" y="0" width="36" height="36" rx="6" fill="#3b82f6" stroke="currentColor" strokeWidth="6"/>
      <rect x="72" y="0" width="36" height="36" rx="6" fill="#facc15" stroke="currentColor" strokeWidth="6"/>
      <rect x="36" y="36" width="36" height="36" rx="6" fill="#22c55e" stroke="currentColor" strokeWidth="6"/>
      <rect x="36" y="72" width="36" height="36" rx="6" fill="#f97316" stroke="currentColor" strokeWidth="6"/>
    </svg>
  );
}
