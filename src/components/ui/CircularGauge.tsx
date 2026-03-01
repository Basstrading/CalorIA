interface CircularGaugeProps {
  consumed: number;
  budget: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularGauge({
  consumed,
  budget,
  size = 200,
  strokeWidth = 12,
  className = '',
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = budget > 0 ? Math.min(consumed / budget, 1) : 0;
  const offset = circumference - progress * circumference;
  const exceeded = consumed > budget;
  const remaining = budget - consumed;
  const strokeColor = exceeded ? '#FF5252' : '#00E676';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A35"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={exceeded ? 0 : offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {exceeded ? (
          <>
            <span className="text-3xl font-bold text-danger">
              +{Math.abs(remaining).toLocaleString('fr-FR')}
            </span>
            <span className="text-sm text-danger/80">kcal en trop</span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold text-text-primary">
              {remaining.toLocaleString('fr-FR')}
            </span>
            <span className="text-sm text-text-secondary">kcal restantes</span>
          </>
        )}
      </div>
    </div>
  );
}
