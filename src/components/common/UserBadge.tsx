import React from 'react';
import { UserInitial } from '../../types';

interface UserBadgeProps {
  initial?: UserInitial;
  actionLabel?: string;
  size?: 'xs' | 'sm' | 'md';
  showFullName?: boolean;
  className?: string;
}

const USER_NAMES: Record<UserInitial, string> = {
  L: 'Lu',
  C: 'Charly',
  T: 'Tomi',
};

export const UserBadge: React.FC<UserBadgeProps> = ({
  initial,
  actionLabel,
  size = 'sm',
  showFullName = true,
  className = '',
}) => {
  if (!initial || !USER_NAMES[initial]) {
    return null;
  }

  const name = USER_NAMES[initial];

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  const badgeCircleSize = {
    xs: 'w-3.5 h-3.5 text-[9px]',
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full bg-ragucci-gold/15 text-ragucci-gold border border-ragucci-gold/40 font-semibold ${sizeClasses} ${className}`}
      title={`${actionLabel ? `${actionLabel}: ` : ''}${name} (${initial})`}
    >
      {actionLabel && (
        <span className="opacity-75 font-normal">{actionLabel}</span>
      )}
      <span
        className={`rounded-full bg-ragucci-gold text-ragucci-primary font-black flex items-center justify-center ${badgeCircleSize}`}
      >
        {initial}
      </span>
      {showFullName && <span className="font-bold">{name}</span>}
    </span>
  );
};
