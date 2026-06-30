import React from 'react';

export const HlaaluLogo = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    {/* Outer Banner/Backing */}
    <path d="M 100 5 L 195 50 L 195 140 L 100 195 L 5 140 L 5 50 Z" fill="#422006" stroke="#ca8a04" strokeWidth="4" />
    <path d="M 100 15 L 180 55 L 180 135 L 100 180 L 20 135 L 20 55 Z" fill="#713f12" stroke="#eab308" strokeWidth="2" />
    
    {/* Scale Central Beam & Stand */}
    <rect x="95" y="40" width="10" height="110" fill="#fef08a" />
    <path d="M 80 150 L 120 150 L 130 160 L 70 160 Z" fill="#ca8a04" />
    <rect x="40" y="55" width="120" height="8" fill="#fef08a" />
    <circle cx="100" cy="59" r="12" fill="#ca8a04" />
    <circle cx="100" cy="59" r="6" fill="#fef08a" />
    
    {/* Scale Bowls & Chains */}
    <path d="M 40 63 L 25 110" stroke="#fef08a" strokeWidth="2" />
    <path d="M 40 63 L 55 110" stroke="#fef08a" strokeWidth="2" />
    <path d="M 15 110 Q 40 130 65 110 Z" fill="#ca8a04" />
    
    <path d="M 160 63 L 145 110" stroke="#fef08a" strokeWidth="2" />
    <path d="M 160 63 L 175 110" stroke="#fef08a" strokeWidth="2" />
    <path d="M 135 110 Q 160 130 185 110 Z" fill="#ca8a04" />

    {/* Coins in bowls */}
    <circle cx="40" cy="106" r="6" fill="#fbbf24" />
    <circle cx="34" cy="108" r="5" fill="#fef08a" />
    <circle cx="48" cy="109" r="4" fill="#fbbf24" />

    <circle cx="160" cy="106" r="6" fill="#fbbf24" />
    <circle cx="152" cy="104" r="5" fill="#fef08a" />
    <circle cx="168" cy="108" r="4" fill="#fbbf24" />

    {/* Decorative Top */}
    <path d="M 90 40 L 100 25 L 110 40 Z" fill="#fef08a" />
  </svg>
);

export const RedoranLogo = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    {/* Shield Base */}
    <path d="M 100 10 L 180 40 C 180 120 140 180 100 195 C 60 180 20 120 20 40 Z" fill="#450a0a" stroke="#b91c1c" strokeWidth="4"/>
    <path d="M 100 20 L 165 45 C 165 110 130 165 100 180 C 70 165 35 110 35 45 Z" fill="#7f1d1d" />
    
    {/* Mandibles / Crest */}
    <path d="M 80 40 Q 60 20 40 10 Q 50 40 70 50 Z" fill="#fca5a5" />
    <path d="M 120 40 Q 140 20 160 10 Q 150 40 130 50 Z" fill="#fca5a5" />

    {/* Bug Shell Segments (Ribs) */}
    <path d="M 50 70 Q 100 40 150 70" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
    <path d="M 45 100 Q 100 80 155 100" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
    <path d="M 55 130 Q 100 110 145 130" fill="none" stroke="#b91c1c" strokeWidth="6" strokeLinecap="round"/>
    <path d="M 75 155 Q 100 140 125 155" fill="none" stroke="#991b1b" strokeWidth="6" strokeLinecap="round"/>

    {/* Central Gem / Core */}
    <circle cx="100" cy="110" r="18" fill="#fef2f2" stroke="#fca5a5" strokeWidth="4"/>
    <circle cx="95" cy="105" r="5" fill="#ffffff" />
    <path d="M 100 92 L 100 50" stroke="#fca5a5" strokeWidth="4" />
  </svg>
);

export const TelvanniLogo = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    {/* Outer Arcane Rings */}
    <circle cx="100" cy="100" r="90" fill="none" stroke="#581c87" strokeWidth="4" strokeDasharray="10 5 30 5" className="animate-[spin_20s_linear_infinite]" />
    <circle cx="100" cy="100" r="75" fill="none" stroke="#9333ea" strokeWidth="2" strokeDasharray="50 15 20 10" className="animate-[spin_15s_linear_infinite_reverse]" />
    
    {/* Base Mushroom Stalk */}
    <path d="M 85 150 Q 80 180 60 190 L 140 190 Q 120 180 115 150 Z" fill="#4c1d95" />
    <path d="M 90 120 L 90 160 L 110 160 L 110 120 Z" fill="#6d28d9" />
    
    {/* Organic Roots / Vines */}
    <path d="M 85 130 Q 70 140 65 170" fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
    <path d="M 115 130 Q 130 140 135 170" fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
    
    {/* Mushroom Cap Base */}
    <path d="M 30 110 C 30 30 170 30 170 110 Q 100 130 30 110 Z" fill="#3b0764" stroke="#c084fc" strokeWidth="3" />
    <path d="M 40 105 C 45 45 155 45 160 105 Q 100 120 40 105 Z" fill="#581c87" />

    {/* Magical Spores/Glows */}
    <circle cx="70" cy="70" r="8" fill="#d8b4fe" />
    <circle cx="130" cy="80" r="6" fill="#e9d5ff" />
    <circle cx="100" cy="55" r="10" fill="#c084fc" />
    <circle cx="150" cy="95" r="4" fill="#a855f7" />
    <circle cx="50" cy="90" r="5" fill="#a855f7" />

    {/* The Eye Of Insight */}
    <path d="M 85 100 Q 100 85 115 100 Q 100 115 85 100" fill="#fdf4ff" stroke="#c084fc" strokeWidth="2" />
    <circle cx="100" cy="100" r="5" fill="#0284c7" />
    <circle cx="100" cy="100" r="2" fill="#e0f2fe" />
  </svg>
);
