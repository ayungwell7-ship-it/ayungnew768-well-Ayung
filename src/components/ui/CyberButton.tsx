import React, { ButtonHTMLAttributes } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl',
    lg: 'px-6 py-3 text-sm sm:text-base font-bold rounded-xl',
  }[size];

  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = `bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-sm active:scale-[0.98] transition-all`;
  } else if (variant === 'glow') {
    variantClasses = `bg-slate-900/90 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/40 hover:border-cyan-400 active:scale-[0.98] transition-all`;
  } else if (variant === 'secondary') {
    variantClasses = 'bg-slate-800/80 text-slate-200 border border-slate-700/80 hover:bg-slate-700/80 hover:text-white active:scale-[0.98] transition-all';
  } else if (variant === 'danger') {
    variantClasses = 'bg-rose-950/60 text-rose-200 border border-rose-700/70 hover:bg-rose-900/80 active:scale-[0.98] transition-all';
  } else if (variant === 'ghost') {
    variantClasses = 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none select-none
        ${sizeClasses}
        ${variantClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
