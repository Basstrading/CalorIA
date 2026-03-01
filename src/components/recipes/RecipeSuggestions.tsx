import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { getRecipeSuggestions } from '../../lib/openrouter';
import { suggestMealSplit } from '../../lib/calories';
import type { Meal, RecipeSuggestion, UserProfile } from '../../types';

type MealType = Meal['meal_type'];

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Petit-dej', emoji: '\u{2615}' },
  { value: 'collation_am', label: 'Collation AM', emoji: '\u{1F34C}' },
  { value: 'lunch', label: 'Dejeuner', emoji: '\u{1F37D}' },
  { value: 'collation_pm', label: 'Collation PM', emoji: '\u{1F34E}' },
  { value: 'dinner', label: 'Diner', emoji: '\u{1F319}' },
];

interface RecipeSuggestionsProps {
  planId: string;
  budget: number;
  meals: Meal[];
  profile: UserProfile;
  onAddMeal: (data: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onClose: () => void;
}

export function RecipeSuggestions({
  planId,
  budget,
  meals,
  profile,
  onAddMeal,
  onClose,
}: RecipeSuggestionsProps) {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  // Calculate available calories for the selected meal type
  const split = suggestMealSplit(budget);
  const consumedForType = meals
    .filter((m) => m.meal_type === mealType)
    .reduce((sum, m) => sum + m.calories, 0);
  const availableCalories = Math.max(0, Math.round(split[mealType] - consumedForType));

  const fetchSuggestions = useCallback(async () => {
    if (availableCalories < 100) {
      setSuggestions([]);
      return;
    }
    setError(null);
    setLoading(true);
    setSuggestions([]);
    try {
      const results = await getRecipeSuggestions({
        goal: profile.goal,
        weight: profile.weight,
        height: profile.height,
        sex: profile.sex,
        totalDailyBudget: budget,
        availableCalories,
        mealType,
      });
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
    setLoading(false);
  }, [availableCalories, mealType, profile, budget]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleChoose = async (recipe: RecipeSuggestion, index: number) => {
    setSaving(index);
    try {
      const success = await onAddMeal({
        plan_id: planId,
        meal_type: mealType,
        food_name: recipe.name,
        calories: recipe.calories,
        proteins: recipe.proteins,
        carbs: recipe.carbs,
        fats: recipe.fats,
        quantity_grams: 0,
      });
      if (success) {
        onClose();
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
    setSaving(null);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Full-screen panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-dark rounded-t-[20px] max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="max-w-md mx-auto p-6 flex flex-col gap-5">
          {/* Header with back button + handle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Retour"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="w-9" />
          </div>

          <h2 className="text-xl font-bold">Idees de repas</h2>

          {/* Meal type chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MEAL_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMealType(t.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-semibold whitespace-nowrap transition-all border ${
                  mealType === t.value
                    ? 'bg-accent-soft border-accent/40 text-text-primary'
                    : 'bg-card border-border text-text-secondary'
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Budget info */}
          <div className="flex items-center justify-between bg-card rounded-card px-4 py-3">
            <span className="text-sm text-text-secondary">Budget disponible</span>
            <span className="text-sm font-bold text-accent">{availableCalories} kcal</span>
          </div>

          {/* Congrats message when < 100 kcal remaining */}
          {availableCalories < 100 && !loading && (
            <div className="bg-accent/10 border border-accent/30 rounded-card p-4 text-center flex flex-col gap-2">
              <p className="text-lg font-bold text-accent">Bravo !</p>
              <p className="text-sm text-text-secondary">
                {availableCalories === 0
                  ? 'Tu as atteint ton objectif pour ce repas. Bien joue !'
                  : `Il ne te reste que ${availableCalories} kcal pour ce repas. Tu as presque atteint ton objectif !`}
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 bg-border rounded w-2/3 mb-3" />
                  <div className="h-3 bg-border rounded w-full mb-2" />
                  <div className="h-3 bg-border rounded w-1/2 mb-3" />
                  <div className="h-8 bg-border rounded w-1/3" />
                </Card>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-danger text-sm text-center">{error}</p>
              <Button variant="secondary" onClick={fetchSuggestions}>
                Reessayer
              </Button>
            </div>
          )}

          {/* Recipe cards */}
          {!loading && suggestions.length > 0 && (
            <div className="flex flex-col gap-3">
              {suggestions.map((recipe, i) => (
                <Card key={`${recipe.name}-${i}`} className="p-4 flex flex-col gap-3">
                  <h3 className="text-base font-bold">{recipe.name}</h3>
                  <p className="text-sm text-text-secondary italic">{recipe.description}</p>

                  {/* Macros */}
                  <div className="flex gap-3 text-xs text-text-secondary flex-wrap">
                    <span>{recipe.calories} kcal</span>
                    <span>{recipe.proteins}g P</span>
                    <span>{recipe.carbs}g G</span>
                    <span>{recipe.fats}g L</span>
                  </div>

                  {/* Ingredients */}
                  <p className="text-xs text-text-secondary">
                    {recipe.ingredients.join(', ')}
                  </p>

                  <Button
                    variant="primary"
                    className="self-start text-sm px-4 py-2"
                    onClick={() => handleChoose(recipe, i)}
                    disabled={saving !== null}
                  >
                    {saving === i ? 'Enregistrement...' : 'Choisir ce repas'}
                  </Button>
                </Card>
              ))}

              {/* Regenerate */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={fetchSuggestions}
                disabled={loading}
              >
                Regenerer des suggestions
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
