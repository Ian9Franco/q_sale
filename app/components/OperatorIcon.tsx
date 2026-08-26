import React from 'react';

interface OperatorIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const OPERATORS: Record<string, { name: string; role: string; color: string; bg: string }> = {
  ash: { name: 'Ash', role: 'Entry Fragger', color: '#ff4757', bg: 'rgba(255, 71, 87, 0.15)' },
  sledge: { name: 'Sledge', role: 'Soft Breacher', color: '#2ed573', bg: 'rgba(46, 213, 115, 0.15)' },
  smoke: { name: 'Smoke', role: 'Area Denial', color: '#9b59b6', bg: 'rgba(155, 89, 182, 0.15)' },
  jager: { name: 'Jäger', role: 'Anti-Gadget', color: '#ffa502', bg: 'rgba(255, 165, 2, 0.15)' },
  thermite: { name: 'Thermite', role: 'Hard Breacher', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.15)' },
  valkyrie: { name: 'Valkyrie', role: 'Intel / Cams', color: '#00d2d3', bg: 'rgba(0, 210, 211, 0.15)' },
  doc: { name: 'Doc', role: 'Support / Heal', color: '#1e90ff', bg: 'rgba(30, 144, 255, 0.15)' },
  recruit: { name: 'Recruit', role: 'Flex Operator', color: '#747d8c', bg: 'rgba(116, 125, 140, 0.15)' },
};

export default function OperatorIcon({ name, size = 32, className = '' }: OperatorIconProps) {
  const opId = name?.toLowerCase() || 'recruit';
  const op = OPERATORS[opId] || OPERATORS.recruit;

  switch (opId) {
    case 'ash':
      // Breaching round explosive design
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#2d0a0f" stroke="#ff4757" strokeWidth="4" />
          <path d="M50 20 L58 42 L80 42 L62 56 L69 78 L50 64 L31 78 L38 56 L20 42 L42 42 Z" fill="#ff4757" />
          <circle cx="50" cy="50" r="10" fill="#2d0a0f" stroke="#fff" strokeWidth="3" />
        </svg>
      );

    case 'sledge':
      // Tactical Breaching Hammer
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#082012" stroke="#2ed573" strokeWidth="4" />
          <path d="M36 28 L64 28 L64 42 L54 42 L54 76 L46 76 L46 42 L36 42 Z" fill="#2ed573" />
          <line x1="30" y1="35" x2="70" y2="35" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <rect x="42" y="70" width="16" height="6" rx="2" fill="#fff" />
        </svg>
      );

    case 'smoke':
      // Toxic Gas Canister / Skull
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#1b0e26" stroke="#9b59b6" strokeWidth="4" />
          <circle cx="50" cy="46" r="22" fill="#9b59b6" />
          <circle cx="42" cy="42" r="5" fill="#1b0e26" />
          <circle cx="58" cy="42" r="5" fill="#1b0e26" />
          <path d="M44 58 Q50 64 56 58" stroke="#1b0e26" strokeWidth="4" strokeLinecap="round" />
          <path d="M38 72 L62 72 M42 78 L58 78" stroke="#9b59b6" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'jager':
      // Magpie ADS Interceptor Drone
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#261a05" stroke="#ffa502" strokeWidth="4" />
          <circle cx="50" cy="50" r="26" stroke="#ffa502" strokeWidth="5" fill="none" />
          <line x1="50" y1="18" x2="50" y2="82" stroke="#ffa502" strokeWidth="5" />
          <line x1="18" y1="50" x2="82" y2="50" stroke="#ffa502" strokeWidth="5" />
          <circle cx="50" cy="50" r="8" fill="#fff" />
        </svg>
      );

    case 'thermite':
      // Brimstone Thermite charge
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#2d100b" stroke="#ff6b6b" strokeWidth="4" />
          <path d="M50 20 Q65 40 50 60 Q35 40 50 20 Z" fill="#ff6b6b" />
          <path d="M50 35 Q58 48 50 60 Q42 48 50 35 Z" fill="#ffa502" />
          <line x1="30" y1="74" x2="70" y2="74" stroke="#ff6b6b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'valkyrie':
      // Black Eye Camera
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#061e24" stroke="#00d2d3" strokeWidth="4" />
          <circle cx="50" cy="50" r="24" fill="#00d2d3" />
          <circle cx="50" cy="50" r="14" fill="#061e24" />
          <circle cx="54" cy="46" r="4" fill="#fff" />
        </svg>
      );

    case 'doc':
      // Stim Pistol / Medical Cross
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#08182b" stroke="#1e90ff" strokeWidth="4" />
          <rect x="42" y="24" width="16" height="52" rx="4" fill="#1e90ff" />
          <rect x="24" y="42" width="52" height="16" rx="4" fill="#1e90ff" />
          <circle cx="50" cy="50" r="6" fill="#fff" />
        </svg>
      );

    default:
      // Recruit Shield
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <rect width="100" height="100" rx="20" fill="#1e2229" stroke="#747d8c" strokeWidth="4" />
          <path d="M50 24 L74 34 L74 58 Q50 78 50 78 Q50 78 26 58 L26 34 Z" fill="#747d8c" />
          <circle cx="50" cy="48" r="8" fill="#fff" />
        </svg>
      );
  }
}
