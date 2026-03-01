import { Slider } from '../ui/Slider';

export interface ActivityConfig {
  key: string;
  emoji: string;
  label: string;
  unit: 'min' | 'h';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  hasSlider: boolean;
}

interface ActivityChipProps {
  config: ActivityConfig;
  selected: boolean;
  value: number;
  onToggle: () => void;
  onValueChange: (value: number) => void;
}

export function ActivityChip({
  config,
  selected,
  value,
  onToggle,
  onValueChange,
}: ActivityChipProps) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-3 px-4 py-3 rounded-button transition-all duration-200 border ${
          selected
            ? 'bg-accent-soft border-accent/40'
            : 'bg-card border-border hover:border-border/80'
        }`}
      >
        <span className="text-xl">{config.emoji}</span>
        <span className={`text-sm font-medium ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
          {config.label}
        </span>
        {selected && config.hasSlider && (
          <span className="ml-auto text-xs font-semibold text-accent">
            {value}{config.unit}
          </span>
        )}
      </button>

      {/* Slider slide-down */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          selected && config.hasSlider ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pb-1">
          <Slider
            min={config.min}
            max={config.max}
            step={config.step}
            value={value}
            onChange={onValueChange}
            unit={config.unit}
          />
        </div>
      </div>
    </div>
  );
}

export const ACTIVITIES: ActivityConfig[] = [
  { key: 'marche',           emoji: '\u{1F6B6}', label: 'Marche',           unit: 'min', min: 15,  max: 120, step: 15, defaultValue: 30,  hasSlider: true },
  { key: 'footing',          emoji: '\u{1F3C3}', label: 'Footing',          unit: 'min', min: 15,  max: 120, step: 15, defaultValue: 30,  hasSlider: true },
  { key: 'musculation',      emoji: '\u{1F4AA}', label: 'Musculation',      unit: 'min', min: 15,  max: 120, step: 15, defaultValue: 60,  hasSlider: true },
  { key: 'sport_collectif',  emoji: '\u{26BD}',  label: 'Sport collectif',  unit: 'min', min: 15,  max: 120, step: 15, defaultValue: 60,  hasSlider: true },
  { key: 'travail_physique', emoji: '\u{1F528}', label: 'Travail physique', unit: 'h',   min: 1,   max: 12,  step: 1,  defaultValue: 8,   hasSlider: true },
  { key: 'travail_bureau',   emoji: '\u{1F4BB}', label: 'Travail de bureau',unit: 'h',   min: 1,   max: 12,  step: 1,  defaultValue: 8,   hasSlider: true },
  { key: 'journee_inactive', emoji: '\u{1F6CB}', label: 'Journee inactive', unit: 'h',   min: 0,   max: 0,   step: 1,  defaultValue: 0,   hasSlider: false },
];
