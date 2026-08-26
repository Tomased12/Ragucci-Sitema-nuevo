import React from 'react';

interface GarmentSvgProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

// 🧥 SACO (Blazer / Suit Jacket - Front & Back View)
export const SacoDrawing: React.FC<GarmentSvgProps> = ({ className = 'w-full h-auto', width = 240, height = 180 }) => (
  <svg viewBox="0 0 400 280" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={width} height={height}>
    {/* FRONT VIEW */}
    <g transform="translate(10, 10)">
      {/* Body Outline */}
      <path d="M 60 40 L 45 65 L 20 100 L 15 220 L 70 230 L 95 230 L 120 220 L 115 100 L 90 65 L 75 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Collar & Lapel Left */}
      <path d="M 60 40 L 75 60 L 55 90 L 78 135 L 75 225" fill="#fcfcfc" stroke="#1e1e1e" strokeWidth="2" />
      {/* Collar & Lapel Right */}
      <path d="M 75 40 L 60 60 L 80 90 L 57 135 L 60 225" fill="#fcfcfc" stroke="#1e1e1e" strokeWidth="2" />
      {/* Inner Neck */}
      <path d="M 60 40 Q 67 48 75 40" stroke="#1e1e1e" strokeWidth="2" fill="none" />
      {/* V-Neck Shirt/Tie guide line */}
      <path d="M 67 45 L 67 130" stroke="#888888" strokeDasharray="3 3" strokeWidth="1.5" />
      {/* Sleeves Left */}
      <path d="M 45 65 L 10 110 L 5 210 L 25 212 L 30 140 L 40 100" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 10 205 L 24 207" stroke="#1e1e1e" strokeWidth="1.5" />
      <circle cx="12" cy="195" r="1.5" fill="#1e1e1e" />
      <circle cx="15" cy="188" r="1.5" fill="#1e1e1e" />
      <circle cx="18" cy="181" r="1.5" fill="#1e1e1e" />
      {/* Sleeves Right */}
      <path d="M 90 65 L 125 110 L 130 210 L 110 212 L 105 140 L 95 100" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 125 205 L 111 207" stroke="#1e1e1e" strokeWidth="1.5" />
      <circle cx="123" cy="195" r="1.5" fill="#1e1e1e" />
      <circle cx="120" cy="188" r="1.5" fill="#1e1e1e" />
      <circle cx="117" cy="181" r="1.5" fill="#1e1e1e" />
      {/* Chest Pocket Left */}
      <path d="M 32 105 L 48 103 L 47 113 L 31 115 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Flap Pocket Left */}
      <path d="M 23 155 L 48 153 L 48 170 L 23 172 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Flap Pocket Right */}
      <path d="M 87 153 L 112 155 L 112 172 L 87 170 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Front Buttons */}
      <circle cx="67.5" cy="140" r="3" fill="#1e1e1e" />
      <circle cx="67.5" cy="170" r="3" fill="#1e1e1e" />
      {/* Label Text */}
      <text x="67" y="255" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">SACO (FRENTE)</text>
    </g>

    {/* BACK VIEW */}
    <g transform="translate(200, 10)">
      {/* Body Outline */}
      <path d="M 60 40 L 45 65 L 20 100 L 15 220 L 67 230 L 120 220 L 115 100 L 90 65 L 75 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Back Collar */}
      <path d="M 60 40 Q 67 46 75 40 L 78 52 Q 67 58 57 52 Z" fill="#f5f5f5" stroke="#1e1e1e" strokeWidth="2" />
      {/* Center Back Seam */}
      <path d="M 67 52 L 67 230" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Back Side Seams */}
      <path d="M 40 70 C 45 120 35 170 30 222" stroke="#1e1e1e" strokeWidth="1.5" />
      <path d="M 95 70 C 90 120 100 170 105 222" stroke="#1e1e1e" strokeWidth="1.5" />
      {/* Side Vents */}
      <path d="M 30 180 L 30 222" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 105 180 L 105 222" stroke="#1e1e1e" strokeWidth="2" />
      {/* Sleeves Left */}
      <path d="M 45 65 L 10 110 L 5 210 L 25 212 L 30 140 L 40 100" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 10 205 L 24 207" stroke="#1e1e1e" strokeWidth="1.5" />
      {/* Sleeves Right */}
      <path d="M 90 65 L 125 110 L 130 210 L 110 212 L 105 140 L 95 100" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 125 205 L 111 207" stroke="#1e1e1e" strokeWidth="1.5" />
      {/* Label Text */}
      <text x="67" y="255" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">SACO (ESPALDA)</text>
    </g>
  </svg>
);

// 🦺 CHALECO (Vest - Front & Back View)
export const ChalecoDrawing: React.FC<GarmentSvgProps> = ({ className = 'w-full h-auto', width = 240, height = 180 }) => (
  <svg viewBox="0 0 400 280" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={width} height={height}>
    {/* FRONT VIEW */}
    <g transform="translate(20, 10)">
      <path d="M 50 40 L 35 60 C 25 90 20 120 20 180 L 50 215 L 65 195 L 80 215 L 110 180 C 110 120 105 90 95 60 L 80 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Deep V-Neck Left & Right */}
      <path d="M 50 40 L 65 130 L 65 195" fill="none" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 80 40 L 65 130" fill="none" stroke="#1e1e1e" strokeWidth="2" />
      {/* Armholes */}
      <path d="M 35 60 Q 45 95 20 120" stroke="#1e1e1e" strokeWidth="2" fill="none" />
      <path d="M 95 60 Q 85 95 110 120" stroke="#1e1e1e" strokeWidth="2" fill="none" />
      {/* Pockets */}
      <path d="M 30 145 L 50 145" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 80 145 L 100 145" stroke="#1e1e1e" strokeWidth="2" />
      {/* Buttons */}
      <circle cx="65" cy="130" r="2.5" fill="#1e1e1e" />
      <circle cx="65" cy="145" r="2.5" fill="#1e1e1e" />
      <circle cx="65" cy="160" r="2.5" fill="#1e1e1e" />
      <circle cx="65" cy="175" r="2.5" fill="#1e1e1e" />
      <circle cx="65" cy="190" r="2.5" fill="#1e1e1e" />
      <text x="65" y="250" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">CHALECO (FRENTE)</text>
    </g>

    {/* BACK VIEW */}
    <g transform="translate(210, 10)">
      <path d="M 50 40 L 35 60 C 25 90 20 120 20 185 L 65 195 L 110 185 C 110 120 105 90 95 60 L 80 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      <path d="M 50 40 Q 65 48 80 40" stroke="#1e1e1e" strokeWidth="2" fill="none" />
      {/* Back Strap Adjuster */}
      <path d="M 40 145 L 90 145" stroke="#1e1e1e" strokeWidth="2" />
      <rect x="60" y="140" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Seams */}
      <path d="M 65 44 L 65 195" stroke="#1e1e1e" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="65" y="250" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">CHALECO (ESPALDA)</text>
    </g>
  </svg>
);

// 👖 PANTALÓN (Trousers - Front & Back View)
export const PantalonDrawing: React.FC<GarmentSvgProps> = ({ className = 'w-full h-auto', width = 240, height = 180 }) => (
  <svg viewBox="0 0 400 280" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={width} height={height}>
    {/* FRONT VIEW */}
    <g transform="translate(25, 10)">
      {/* Waistband */}
      <rect x="25" y="20" width="80" height="12" rx="1" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <circle cx="65" cy="26" r="2" fill="#1e1e1e" />
      {/* Belt Loops */}
      <rect x="33" y="18" width="4" height="16" fill="#1e1e1e" />
      <rect x="52" y="18" width="4" height="16" fill="#1e1e1e" />
      <rect x="74" y="18" width="4" height="16" fill="#1e1e1e" />
      <rect x="93" y="18" width="4" height="16" fill="#1e1e1e" />
      {/* Fly & Crotch */}
      <path d="M 65 32 L 65 75 Q 65 85 65 90" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 65 32 L 72 32 L 72 68 Q 67 76 65 76" stroke="#1e1e1e" strokeWidth="1.5" fill="none" />
      {/* Legs */}
      <path d="M 25 32 L 15 220 L 52 220 L 65 90 L 78 220 L 115 220 L 105 32 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Slanted Side Pockets */}
      <path d="M 27 34 L 40 60" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 103 34 L 90 60" stroke="#1e1e1e" strokeWidth="2" />
      {/* Center Creases */}
      <path d="M 40 60 L 33.5 220" stroke="#888888" strokeDasharray="3 3" strokeWidth="1.2" />
      <path d="M 90 60 L 96.5 220" stroke="#888888" strokeDasharray="3 3" strokeWidth="1.2" />
      <text x="65" y="250" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">PANTALÓN (FRENTE)</text>
    </g>

    {/* BACK VIEW */}
    <g transform="translate(215, 10)">
      {/* Waistband */}
      <rect x="25" y="20" width="80" height="12" rx="1" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      {/* Belt Loops */}
      <rect x="33" y="18" width="4" height="16" fill="#1e1e1e" />
      <rect x="63" y="18" width="4" height="16" fill="#1e1e1e" />
      <rect x="93" y="18" width="4" height="16" fill="#1e1e1e" />
      {/* Center Seam & Crotch */}
      <path d="M 65 32 L 65 90" stroke="#1e1e1e" strokeWidth="2" />
      {/* Legs */}
      <path d="M 25 32 L 15 220 L 52 220 L 65 90 L 78 220 L 115 220 L 105 32 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Back Welt Pockets */}
      <rect x="32" y="55" width="22" height="4" rx="1" fill="#1e1e1e" />
      <rect x="76" y="55" width="22" height="4" rx="1" fill="#1e1e1e" />
      {/* Darts */}
      <path d="M 43 32 L 43 48" stroke="#1e1e1e" strokeWidth="1.2" />
      <path d="M 87 32 L 87 48" stroke="#1e1e1e" strokeWidth="1.2" />
      <text x="65" y="250" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">PANTALÓN (ESPALDA)</text>
    </g>
  </svg>
);

// 👔 CAMISA (Dress Shirt - Front & Back View)
export const CamisaDrawing: React.FC<GarmentSvgProps> = ({ className = 'w-full h-auto', width = 240, height = 180 }) => (
  <svg viewBox="0 0 400 280" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={width} height={height}>
    {/* FRONT VIEW */}
    <g transform="translate(15, 10)">
      {/* Body Outline */}
      <path d="M 55 40 L 40 60 L 20 95 L 18 215 C 40 225 90 225 112 215 L 110 95 L 90 60 L 75 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Shirt Collar */}
      <path d="M 55 40 L 42 62 L 65 52 L 88 62 L 75 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <circle cx="65" cy="53" r="2" fill="#1e1e1e" />
      {/* Center Placket & Buttons */}
      <path d="M 65 52 L 65 220" stroke="#1e1e1e" strokeWidth="2" />
      <path d="M 60 52 L 60 220" stroke="#1e1e1e" strokeWidth="1.2" />
      <circle cx="65" cy="75" r="2" fill="#1e1e1e" />
      <circle cx="65" cy="100" r="2" fill="#1e1e1e" />
      <circle cx="65" cy="125" r="2" fill="#1e1e1e" />
      <circle cx="65" cy="150" r="2" fill="#1e1e1e" />
      <circle cx="65" cy="175" r="2" fill="#1e1e1e" />
      <circle cx="65" cy="200" r="2" fill="#1e1e1e" />
      {/* Sleeves Left */}
      <path d="M 40 60 L 10 100 L 5 195 L 23 197 L 26 130 L 32 95" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <rect x="5" y="185" width="18" height="12" rx="1" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Sleeves Right */}
      <path d="M 90 60 L 120 100 L 125 195 L 107 197 L 104 130 L 98 95" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <rect x="107" y="185" width="18" height="12" rx="1" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Pocket Left */}
      <path d="M 32 95 L 50 95 L 50 120 L 41 127 L 32 120 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.5" />
      <text x="65" y="250" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">CAMISA (FRENTE)</text>
    </g>

    {/* BACK VIEW */}
    <g transform="translate(205, 10)">
      {/* Body Outline */}
      <path d="M 55 40 L 40 60 L 20 95 L 18 215 C 40 225 90 225 112 215 L 110 95 L 90 60 L 75 40 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2.5" />
      {/* Back Collar */}
      <path d="M 55 40 Q 65 46 75 40 L 73 50 Q 65 54 57 50 Z" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      {/* Back Yoke */}
      <path d="M 38 68 Q 65 72 92 68" stroke="#1e1e1e" strokeWidth="2" fill="none" />
      {/* Back Pleats */}
      <path d="M 45 68 L 45 220" stroke="#888888" strokeDasharray="3 3" strokeWidth="1.2" />
      <path d="M 85 68 L 85 220" stroke="#888888" strokeDasharray="3 3" strokeWidth="1.2" />
      {/* Sleeves Left */}
      <path d="M 40 60 L 10 100 L 5 195 L 23 197 L 26 130 L 32 95" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <rect x="5" y="185" width="18" height="12" rx="1" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      {/* Sleeves Right */}
      <path d="M 90 60 L 120 100 L 125 195 L 107 197 L 104 130 L 98 95" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
      <rect x="107" y="185" width="18" height="12" rx="1" fill="#ffffff" stroke="#1e1e1e" strokeWidth="1.8" />
      <text x="65" y="250" textAnchor="middle" fill="#333333" fontSize="12" fontWeight="bold" fontFamily="sans-serif">CAMISA (ESPALDA)</text>
    </g>
  </svg>
);
