import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
}

export function Input({ label, suffix, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-text-secondary font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={`w-full bg-card border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-accent/60 transition-colors ${suffix ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
