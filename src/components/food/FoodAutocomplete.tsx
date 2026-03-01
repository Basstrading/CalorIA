import { useEffect, useRef, useState } from 'react';
import type { FoodDatabaseEntry } from '../../types';
import { useFoodSearch } from '../../hooks/useFoodSearch';

interface FoodAutocompleteProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (entry: FoodDatabaseEntry) => void;
  placeholder?: string;
}

export function FoodAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
}: FoodAutocompleteProps) {
  const { results, loading, search, clear } = useFoodSearch();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length >= 2) {
      search(value);
      setOpen(true);
    } else {
      clear();
      setOpen(false);
    }
  }, [value, search, clear]);

  const handleBlur = () => {
    // Delay to allow onMouseDown on dropdown items to fire first
    setTimeout(() => setOpen(false), 150);
  };

  const handleSelect = (entry: FoodDatabaseEntry) => {
    onSelect(entry);
    onChange(entry.name);
    setOpen(false);
    clear();
  };

  const showDropdown = open && results.length > 0;

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="text-sm text-text-secondary font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          className="w-full bg-card border border-border rounded-button px-4 py-3 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-accent/60 transition-colors pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {showDropdown && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-button overflow-hidden shadow-lg max-h-64 overflow-y-auto">
            {results.map((entry, i) => (
              <button
                key={`${entry.source}-${entry.name}-${i}`}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-accent-soft/30 transition-colors border-b border-border/50 last:border-b-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(entry)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-text-primary truncate flex-1">
                    {entry.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                      entry.source === 'ciqual'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {entry.source === 'ciqual' ? 'Ciqual' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {Math.round(entry.calories_per_100g)} kcal
                  {' · '}
                  {entry.proteins_per_100g}g P
                  {' · '}
                  {entry.carbs_per_100g}g G
                  {' · '}
                  {entry.fats_per_100g}g L
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
