export function Landscape() {
  return (
    <div className="landscape" aria-hidden="true">
      <svg className="landscape__svg" viewBox="0 0 1200 280" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fd4c8" />
            <stop offset="100%" stopColor="#7eb8b0" />
          </linearGradient>
        </defs>
        <ellipse className="landscape__cloud landscape__cloud--a" cx="180" cy="70" rx="90" ry="36" fill="#fff" />
        <ellipse className="landscape__cloud landscape__cloud--b" cx="980" cy="56" rx="110" ry="40" fill="#fff" />
        <ellipse className="landscape__cloud landscape__cloud--c" cx="620" cy="48" rx="70" ry="28" fill="#fff" opacity="0.85" />

        <rect x="0" y="190" width="1200" height="90" fill="url(#water)" />
        <path d="M0 210 Q150 198 300 212 T600 208 T900 214 T1200 206 V280 H0Z" fill="#8ec4ba" opacity="0.55" />

        {/* left island */}
        <g className="landscape__island landscape__island--left">
          <path d="M120 210h280l-24 36H144z" fill="#6f9b6a" stroke="#1a1a1a" strokeWidth="3" />
          <path d="M150 210h220l-16 22H166z" fill="#87b57a" />
          <polygon points="190,210 210,140 230,210" fill="#7aa88a" stroke="#1a1a1a" strokeWidth="2.5" />
          <polygon points="230,210 255,118 280,210" fill="#5f8f78" stroke="#1a1a1a" strokeWidth="2.5" />
          <polygon points="280,210 298,150 316,210" fill="#8fb89a" stroke="#1a1a1a" strokeWidth="2.5" />
          <circle cx="175" cy="198" r="8" fill="#f4f0e8" stroke="#1a1a1a" strokeWidth="2" />
          <path d="M183 198h70" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          <path d="M253 198v18" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* right island */}
        <g className="landscape__island landscape__island--right">
          <path d="M760 214h300l-28 40H788z" fill="#6f9b6a" stroke="#1a1a1a" strokeWidth="3" />
          <path d="M790 214h240l-18 24H808z" fill="#87b57a" />
          <polygon points="860,214 885,128 910,214" fill="#6d9a88" stroke="#1a1a1a" strokeWidth="2.5" />
          <polygon points="910,214 940,110 970,214" fill="#557f6e" stroke="#1a1a1a" strokeWidth="2.5" />
          <polygon points="970,214 990,150 1010,214" fill="#8fb89a" stroke="#1a1a1a" strokeWidth="2.5" />
          <rect x="830" y="196" width="14" height="14" rx="2" fill="#e4572e" stroke="#1a1a1a" strokeWidth="2" />
        </g>
      </svg>
    </div>
  )
}
