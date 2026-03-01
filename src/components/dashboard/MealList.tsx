import type { Meal } from '../../types';
import { MealCard } from './MealCard';

interface MealListProps {
  meals: Meal[];
  onDelete: (id: string) => void;
}

export function MealList({ meals, onDelete }: MealListProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">Aucun repas enregistre</p>
        <p className="text-text-secondary/60 text-xs mt-1">
          Appuie sur + pour ajouter un repas
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onDelete={onDelete} />
      ))}
    </div>
  );
}
