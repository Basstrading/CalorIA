import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'font-outfit font-semibold rounded-button px-6 py-3 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-accent text-dark hover:brightness-110',
    secondary: 'bg-card text-text-primary border border-border hover:border-accent/40',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
