interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleProps<T extends string> {
  options: [ToggleOption<T>, ToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Toggle<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: ToggleProps<T>) {
  return (
    <div className={`flex bg-card rounded-button p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2.5 px-4 rounded-[10px] text-sm font-semibold transition-all duration-200 ${
            value === option.value
              ? 'bg-accent text-dark'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
