const VitoriaLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 50" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(42, 80%, 55%)" />
        <stop offset="100%" stopColor="hsl(42, 90%, 70%)" />
      </linearGradient>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(260, 60%, 55%)" />
        <stop offset="100%" stopColor="hsl(210, 70%, 50%)" />
      </linearGradient>
    </defs>
    {/* Microphone icon */}
    <g transform="translate(4, 5)">
      <rect x="8" y="2" width="8" height="22" rx="4" fill="url(#goldGrad)" />
      <path d="M4 18 C4 26 20 26 20 18" stroke="url(#goldGrad)" strokeWidth="2" fill="none" />
      <line x1="12" y1="26" x2="12" y2="32" stroke="url(#goldGrad)" strokeWidth="2" />
      <line x1="6" y1="32" x2="18" y2="32" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />
      {/* Brazil diamond */}
      <polygon points="12,35 17,39 12,43 7,39" fill="url(#goldGrad)" opacity="0.6" />
    </g>
    <text x="32" y="28" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="22" fill="url(#goldGrad)">
      VITÓRIA
    </text>
    <text x="130" y="28" fontFamily="Space Grotesk, sans-serif" fontWeight="400" fontSize="22" fill="url(#purpleGrad)">
      NEWS
    </text>
    <rect x="32" y="34" width="160" height="2" rx="1" fill="url(#purpleGrad)" opacity="0.4" />
  </svg>
);

export default VitoriaLogo;
