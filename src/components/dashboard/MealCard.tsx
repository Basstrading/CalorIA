import type { Meal } from '../../types';

const MEAL_TYPE_LABELS: Record<Meal['meal_type'], string> = {
  breakfast: 'Petit-dej',
  collation_am: 'Collation AM',
  lunch: 'Dejeuner',
  collation_pm: 'Collation PM',
  dinner: 'Diner',
};

const MEAL_TYPE_EMOJIS: Record<Meal['meal_type'], string> = {
  breakfast: '\u{2615}',
  collation_am: '\u{1F34C}',
  lunch: '\u{1F37D}',
  collation_pm: '\u{1F34E}',
  dinner: '\u{1F319}',
};

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  const time = new Date(meal.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-card rounded-button p-4 flex items-center gap-3">
      <span className="text-2xl">{MEAL_TYPE_EMOJIS[meal.meal_type]}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {meal.food_name}
          </span>
          <span className="text-xs text-text-secondary shrink-0">
            {MEAL_TYPE_LABELS[meal.meal_type]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-text-secondary">
          <span className="font-medium text-accent">{meal.calories} kcal</span>
          <span>{meal.quantity_grams}g</span>
          <span>{time}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(meal.id)}
        className="p-2 text-text-secondary hover:text-danger transition-colors shrink-0"
        aria-label="Supprimer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
