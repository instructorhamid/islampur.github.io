/**
 * Decorative illustrations inspired by Sylhet's tea-garden hills and the Surma river.
 * These are drawings, not photographs, and are hidden from assistive technology.
 */
export function Hills({ className = "", variant = "footer" }: { className?: string; variant?: "footer" | "divider" }) {
  if (variant === "divider") {
    return (
      <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80V48c120-26 260-38 420-20s300 34 460 18 320-46 560-30v64z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 80V52c90-22 190-40 330-30 150 11 220 44 380 40s250-50 400-52c140-2 240 24 330 38v32z" fill="var(--green)" opacity=".28" />
      <path d="M0 80V64c140-28 270-30 420-12s280 30 440 14 340-40 580-18v32z" fill="currentColor" />
    </svg>
  );
}

export function HeroLandscape({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 460" aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaf6ee" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8efe1" />
          <stop offset=".5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8efe1" />
        </linearGradient>
        <clipPath id="frame">
          <rect width="600" height="460" rx="36" />
        </clipPath>
      </defs>
      <g clipPath="url(#frame)">
        <rect width="600" height="460" fill="url(#sky)" />
        {/* sun */}
        <circle cx="452" cy="112" r="46" fill="#fbe9b7" />
        <circle cx="452" cy="112" r="64" fill="#fbe9b7" opacity=".35" />
        {/* birds */}
        <path d="M120 96q8-8 16 0q8-8 16 0M176 70q6-6 12 0q6-6 12 0" fill="none" stroke="#0b5d36" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
        {/* far hills */}
        <path d="M0 236c60-44 120-70 196-56 70 13 108 48 170 44 70-5 106-58 178-62 30-2 56 6 56 6v292H0z" fill="#cde9d7" />
        {/* middle hills with tea rows */}
        <path d="M0 278c70-40 150-56 230-40 76 15 120 46 196 40 70-6 120-34 174-30v212H0z" fill="#8fcfa8" />
        <g fill="none" stroke="#5fae80" strokeWidth="5" strokeLinecap="round" opacity=".7">
          <path d="M40 300c50-20 110-28 170-18" />
          <path d="M28 322c60-22 128-30 200-18" />
          <path d="M20 346c70-22 150-30 230-16" />
          <path d="M330 296c60 6 120-6 170-22" />
          <path d="M320 320c70 6 140-6 200-26" />
          <path d="M318 346c80 4 160-8 240-30" />
        </g>
        {/* school building on the hill */}
        <g transform="translate(262 196)">
          <rect x="-4" y="40" width="128" height="52" rx="3" fill="#ffffff" stroke="#0b5d36" strokeWidth="3" />
          <path d="M-12 42L60 8l72 34z" fill="#168447" stroke="#0b5d36" strokeWidth="3" strokeLinejoin="round" />
          <rect x="48" y="58" width="24" height="34" rx="2" fill="#0b5d36" />
          {[8, 28, 84, 104].map((x) => (
            <rect key={x} x={x} y="56" width="12" height="14" rx="1.5" fill="#cde9d7" stroke="#0b5d36" strokeWidth="2" />
          ))}
          {/* flag of Bangladesh */}
          <line x1="140" y1="92" x2="140" y2="14" stroke="#0b5d36" strokeWidth="3" strokeLinecap="round" />
          <rect x="141" y="14" width="34" height="21" fill="#006a4e" />
          <circle cx="156" cy="24.5" r="6.5" fill="#f42a41" />
        </g>
        {/* near hill */}
        <path d="M0 352c90-34 190-44 300-26 110 17 190 22 300-10v144H0z" fill="#168447" />
        <g fill="none" stroke="#2c9a5c" strokeWidth="6" strokeLinecap="round" opacity=".8">
          <path d="M30 376c80-20 170-24 250-12" />
          <path d="M330 372c80 8 160 2 240-18" />
        </g>
        {/* river (Surma) */}
        <path d="M0 410c110-22 210-20 320-6s200 12 280-6v62H0z" fill="url(#river)" />
        <g stroke="#9fd3b4" strokeWidth="3" strokeLinecap="round" opacity=".9">
          <path d="M70 426h46M210 420h60M380 430h52M500 418h40" />
        </g>
        {/* foreground bank */}
        <path d="M0 446c120-14 260-12 380-2s170 6 220-2v18H0z" fill="#0b5d36" />
      </g>
    </svg>
  );
}
