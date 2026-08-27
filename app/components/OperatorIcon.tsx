import React from 'react';
import {
  Flame,
  Hammer,
  Skull,
  Crosshair,
  Zap,
  Eye,
  Heart,
  Shield,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface OperatorIconProps {
  name: string;
  size?: number;
  className?: string;
}

type OperatorDef = {
  name: string;
  role: string;
  Icon: React.ComponentType<LucideProps>;
};

export const OPERATORS: Record<string, OperatorDef> = {
  ash: { name: 'Ash', role: 'Entry Fragger', Icon: Flame },
  sledge: { name: 'Sledge', role: 'Soft Breacher', Icon: Hammer },
  smoke: { name: 'Smoke', role: 'Area Denial', Icon: Skull },
  jager: { name: 'Jäger', role: 'Anti-Gadget', Icon: Crosshair },
  thermite: { name: 'Thermite', role: 'Hard Breacher', Icon: Zap },
  valkyrie: { name: 'Valkyrie', role: 'Intel / Cams', Icon: Eye },
  doc: { name: 'Doc', role: 'Support / Heal', Icon: Heart },
  recruit: { name: 'Recruit', role: 'Flex Operator', Icon: Shield },
};

export default function OperatorIcon({ name, size = 28, className = '' }: OperatorIconProps) {
  const opId = name?.toLowerCase() || 'recruit';
  const op = OPERATORS[opId] || OPERATORS.recruit;
  const { Icon } = op;

  const iconSize = Math.round(size * 0.75);

  return (
    <div className={`flex items-center justify-center flex-shrink-0 ${className}`}>
      <Icon size={iconSize} color="#000000" strokeWidth={2.4} />
    </div>
  );
}
