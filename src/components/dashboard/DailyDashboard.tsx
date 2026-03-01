import { useMemo, useState } from 'react';
import { CircularGauge } from '../ui/CircularGauge';
import { Card } from '../ui/Card';
import { MealList } from './MealList';
import { FloatingActionButton } from './FloatingActionButton';
import { AddMealModal } from './AddMealModal';
import { FoodScanner } from '../scanner/FoodScanner';
import { RecipeSuggestions } from '../recipes/RecipeSuggestions';
import { suggestMealSplit } from '../../lib/calories';
import type { FabAction } from './FloatingActionButton';
import type { DailyPlan, Meal, UserProfile } from '../../types';

interface DailyDashboardProps {
  profile: UserProfile;
  plan: DailyPlan;
  meals: Meal[];
  totalCaloriesToday: number;
  onAddMeal: (data: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onDeleteMeal: (id: string) => Promise<boolean>;
  onResetPlan: () => Promise<boolean>;
  onEditProfile: () => void;
  onSignOut: () => void;
}

const SPLIT_CONFIG: {
  key: Meal['meal_type'];
  label: string;
  emoji: string;
}[] = [
  { key: 'breakfast', label: 'Petit-dej', emoji: '\u{2615}' },
  { key: 'collation_am', label: 'Collation AM', emoji: '\u{1F34C}' },
  { key: 'lunch', label: 'Dejeuner', emoji: '\u{1F37D}' },
  { key: 'collation_pm', label: 'Collation PM', emoji: '\u{1F34E}' },
  { key: 'dinner', label: 'Diner', emoji: '\u{1F319}' },
];

function formatFrenchDate(): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
  const now = new Date();
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
}

export function DailyDashboard({
  profile,
  plan,
  meals,
  totalCaloriesToday,
  onAddMeal,
  onDeleteMeal,
  onResetPlan,
  onEditProfile,
  onSignOut,
}: DailyDashboardProps) {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showScanner, setShowScanner] = useState(() => {
    // Restore scanner state after mobile camera intent reload
    if (sessionStorage.getItem('caloria_scanner_open') === '1') {
      sessionStorage.removeItem('caloria_scanner_open');
      return true;
    }
    return false;
  });
  const [showRecipes, setShowRecipes] = useState(false);

  const split = useMemo(
    () => suggestMealSplit(plan.calorie_budget),
    [plan.calorie_budget],
  );

  // Calories consumed per meal type
  const consumedByType = useMemo(() => {
    const result: Record<Meal['meal_type'], number> = {
      breakfast: 0, collation_am: 0, lunch: 0, collation_pm: 0, dinner: 0,
    };
    for (const m of meals) {
      result[m.meal_type] += m.calories;
    }
    return result;
  }, [meals]);

  const openScanner = () => {
    sessionStorage.setItem('caloria_scanner_open', '1');
    setShowScanner(true);
  };

  const closeScanner = () => {
    sessionStorage.removeItem('caloria_scanner_open');
    setShowScanner(false);
  };

  const handleFabAction = (action: FabAction) => {
    if (action === 'manual') {
      setShowAddMeal(true);
    } else if (action === 'scan') {
      openScanner();
    } else if (action === 'ideas') {
      setShowRecipes(true);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen min-h-dvh pb-24">
      {/* Header */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetPlan}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Refaire ma journee"
            title="Refaire ma journee"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <p className="text-text-secondary text-sm">{formatFrenchDate()}</p>
            <h1 className="text-xl font-bold tracking-tight mt-0.5">Mon budget</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEditProfile}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Modifier mon profil"
            title="Modifier mon profil"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Deconnexion
          </button>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex justify-center py-4">
        <CircularGauge consumed={totalCaloriesToday} budget={plan.calorie_budget} />
      </div>

      {/* Budget summary */}
      <div className="px-6 flex justify-center gap-6 text-center text-xs text-text-secondary mb-4">
        <div>
          <p className="text-lg font-bold text-text-primary">{plan.calorie_budget.toLocaleString('fr-FR')}</p>
          <p>Budget</p>
        </div>
        <div>
          <p className="text-lg font-bold text-accent">{totalCaloriesToday.toLocaleString('fr-FR')}</p>
          <p>Consomme</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${totalCaloriesToday > plan.calorie_budget ? 'text-danger' : 'text-text-primary'}`}>
            {Math.abs(plan.calorie_budget - totalCaloriesToday).toLocaleString('fr-FR')}
          </p>
          <p>{totalCaloriesToday > plan.calorie_budget ? 'En trop' : 'Restant'}</p>
        </div>
      </div>

      {/* Meal split grid */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-2">
          {SPLIT_CONFIG.map((item) => {
            const target = split[item.key];
            const consumed = consumedByType[item.key];
            const progress = target > 0 ? Math.min(consumed / target, 1) : 0;

            return (
              <Card key={item.key} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-xs font-medium text-text-secondary">{item.label}</span>
                </div>
                <p className="text-sm font-semibold">
                  <span className="text-accent">{consumed}</span>
                  <span className="text-text-secondary font-normal"> / {target} kcal</span>
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      consumed > target ? 'bg-danger' : 'bg-accent'
                    }`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Meals list */}
      <div className="px-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Repas du jour</h2>
        <MealList meals={meals} onDelete={onDeleteMeal} />
      </div>

      {/* FAB */}
      <FloatingActionButton onAction={handleFabAction} />

      {/* Add meal modal */}
      {showAddMeal && (
        <AddMealModal
          planId={plan.id}
          budget={plan.calorie_budget}
          meals={meals}
          onSave={onAddMeal}
          onClose={() => setShowAddMeal(false)}
        />
      )}

      {/* Food scanner */}
      {showScanner && (
        <FoodScanner
          planId={plan.id}
          budget={plan.calorie_budget}
          meals={meals}
          onAddMeal={onAddMeal}
          onClose={closeScanner}
        />
      )}

      {/* Recipe suggestions */}
      {showRecipes && (
        <RecipeSuggestions
          planId={plan.id}
          budget={plan.calorie_budget}
          totalCaloriesToday={totalCaloriesToday}
          meals={meals}
          profile={profile}
          onAddMeal={onAddMeal}
          onClose={() => setShowRecipes(false)}
        />
      )}
    </div>
  );
}
