interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  className?: string;
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  unit,
  className = '',
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{min}{unit}</span>
        <span className="text-sm font-semibold text-accent">{value}{unit}</span>
        <span className="text-sm text-text-secondary">{max}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full slider-accent"
        style={{
          background: `linear-gradient(to right, #00E676 0%, #00E676 ${percent}%, #2A2A35 ${percent}%, #2A2A35 100%)`,
        }}
      />
    </div>
  );
}
