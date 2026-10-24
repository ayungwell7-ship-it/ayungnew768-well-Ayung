import React, { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  cornerCut?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

export const CyberCard: React.FC<CyberCardProps> = ({
  children,
  className = '',
  glow = false,
  highlight = false,
  onClick,
}) => {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-slate-900/60 backdrop-blur-md rounded-2xl border
        ${highlight ? theme.border : 'border-slate-800/80 hover:border-slate-700/80'}
        ${glow ? 'shadow-lg shadow-cyan-950/20' : 'shadow-sm'}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
