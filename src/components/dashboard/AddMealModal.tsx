import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { FoodAutocomplete } from '../food/FoodAutocomplete';
import { calculateSmartPortion, inferFoodCategory } from '../../lib/calories';
import type { PortionRecommendation } from '../../lib/calories';
import type { FoodDatabaseEntry, Meal } from '../../types';

type MealType = Meal['meal_type'];

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Petit-dej', emoji: '\u{2615}' },
  { value: 'collation_am', label: 'Collation AM', emoji: '\u{1F34C}' },
  { value: 'lunch', label: 'Dejeuner', emoji: '\u{1F37D}' },
  { value: 'collation_pm', label: 'Collation PM', emoji: '\u{1F34E}' },
  { value: 'dinner', label: 'Diner', emoji: '\u{1F319}' },
];

interface AddMealModalProps {
  planId: string;
  budget: number;
  meals: Meal[];
  onSave: (data: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onClose: () => void;
}

export function AddMealModal({ planId, budget, meals, onSave, onClose }: AddMealModalProps) {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track selected food for proportional recalculation
  const [selectedFood, setSelectedFood] = useState<FoodDatabaseEntry | null>(null);
  const [portionReco, setPortionReco] = useState<PortionRecommendation | null>(null);

  const handleFoodSelect = (entry: FoodDatabaseEntry) => {
    setSelectedFood(entry);
    setCalories(String(Math.round(entry.calories_per_100g)));
    setProteins(String(entry.proteins_per_100g));
    setCarbs(String(entry.carbs_per_100g));
    setFats(String(entry.fats_per_100g));

    const category = inferFoodCategory(
      entry.name, entry.calories_per_100g,
      entry.proteins_per_100g, entry.carbs_per_100g, entry.fats_per_100g,
    );
    const reco = calculateSmartPortion({
      foodName: entry.name,
      caloriesPer100g: entry.calories_per_100g,
      proteinsPer100g: entry.proteins_per_100g,
      carbsPer100g: entry.carbs_per_100g,
      fatsPer100g: entry.fats_per_100g,
      foodCategory: category,
      mealType,
      totalDailyBudget: budget,
      meals,
    });
    setPortionReco(reco);
    setQuantity(String(reco.recommendedGrams > 0 ? reco.recommendedGrams : 100));

    // Recalculate macros for recommended quantity
    const qty = reco.recommendedGrams > 0 ? reco.recommendedGrams : 100;
    const ratio = qty / 100;
    setCalories(String(Math.round(entry.calories_per_100g * ratio)));
    setProteins(String(Math.round(entry.proteins_per_100g * ratio * 10) / 10));
    setCarbs(String(Math.round(entry.carbs_per_100g * ratio * 10) / 10));
    setFats(String(Math.round(entry.fats_per_100g * ratio * 10) / 10));
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    if (selectedFood) {
      const qty = parseFloat(val);
      if (!isNaN(qty) && qty > 0) {
        const ratio = qty / 100;
        setCalories(String(Math.round(selectedFood.calories_per_100g * ratio)));
        setProteins(String(Math.round(selectedFood.proteins_per_100g * ratio * 10) / 10));
        setCarbs(String(Math.round(selectedFood.carbs_per_100g * ratio * 10) / 10));
        setFats(String(Math.round(selectedFood.fats_per_100g * ratio * 10) / 10));
      }
    }
  };

  const handleManualMacroEdit = (
    setter: (v: string) => void,
    val: string,
  ) => {
    setter(val);
    // Detach auto-calculation when user manually edits a nutritional field
    setSelectedFood(null);
    setPortionReco(null);
  };

  // Recalculate recommendation when mealType changes
  useEffect(() => {
    if (!selectedFood) return;
    const category = inferFoodCategory(
      selectedFood.name, selectedFood.calories_per_100g,
      selectedFood.proteins_per_100g, selectedFood.carbs_per_100g, selectedFood.fats_per_100g,
    );
    const reco = calculateSmartPortion({
      foodName: selectedFood.name,
      caloriesPer100g: selectedFood.calories_per_100g,
      proteinsPer100g: selectedFood.proteins_per_100g,
      carbsPer100g: selectedFood.carbs_per_100g,
      fatsPer100g: selectedFood.fats_per_100g,
      foodCategory: category,
      mealType,
      totalDailyBudget: budget,
      meals,
    });
    setPortionReco(reco);
    setQuantity(String(reco.recommendedGrams > 0 ? reco.recommendedGrams : 100));
    const qty = reco.recommendedGrams > 0 ? reco.recommendedGrams : 100;
    const ratio = qty / 100;
    setCalories(String(Math.round(selectedFood.calories_per_100g * ratio)));
    setProteins(String(Math.round(selectedFood.proteins_per_100g * ratio * 10) / 10));
    setCarbs(String(Math.round(selectedFood.carbs_per_100g * ratio * 10) / 10));
    setFats(String(Math.round(selectedFood.fats_per_100g * ratio * 10) / 10));
  }, [mealType, selectedFood, budget, meals]);

  const handleSave = async () => {
    setError(null);

    if (!foodName.trim()) {
      setError('Nom de l\'aliment requis');
      return;
    }
    const cal = parseFloat(calories);
    const qty = parseFloat(quantity);
    if (isNaN(cal) || cal <= 0) {
      setError('Calories invalides');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Quantite invalide');
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSave({
        plan_id: planId,
        meal_type: mealType,
        food_name: foodName.trim(),
        calories: cal,
        proteins: parseFloat(proteins) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        quantity_grams: qty,
      });

      if (success) {
        onClose();
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-dark rounded-t-[20px] max-h-[85vh] overflow-y-auto animate-slide-up">
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

          <h2 className="text-xl font-bold">Ajouter un repas</h2>

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

          {/* Food autocomplete */}
          <FoodAutocomplete
            id="food-name"
            label="Aliment"
            placeholder="Ex: Poulet grille"
            value={foodName}
            onChange={setFoodName}
            onSelect={handleFoodSelect}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="calories"
              label="Calories"
              type="number"
              inputMode="numeric"
              placeholder="350"
              suffix="kcal"
              value={calories}
              onChange={(e) => handleManualMacroEdit(setCalories, e.target.value)}
            />
            <Input
              id="quantity"
              label="Quantite"
              type="number"
              inputMode="numeric"
              placeholder="200"
              suffix="g"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />
          </div>

          {/* Coach recommendation */}
          {portionReco && selectedFood && (
            <Card className="p-4 border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-secondary">Budget du repas</p>
                <p className="text-sm font-semibold">
                  <span className="text-accent">{portionReco.mealRemaining}</span>
                  <span className="text-text-secondary"> / {portionReco.mealBudget} kcal</span>
                </p>
              </div>
              <p className="text-lg font-bold text-accent mb-1">
                Portion conseillee : {portionReco.recommendedGrams}g
              </p>
              <p className="text-sm text-text-secondary">{portionReco.coachMessage}</p>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Input
              id="proteins"
              label="Proteines"
              type="number"
              inputMode="decimal"
              placeholder="0"
              suffix="g"
              value={proteins}
              onChange={(e) => handleManualMacroEdit(setProteins, e.target.value)}
            />
            <Input
              id="carbs"
              label="Glucides"
              type="number"
              inputMode="decimal"
              placeholder="0"
              suffix="g"
              value={carbs}
              onChange={(e) => handleManualMacroEdit(setCarbs, e.target.value)}
            />
            <Input
              id="fats"
              label="Lipides"
              type="number"
              inputMode="decimal"
              placeholder="0"
              suffix="g"
              value={fats}
              onChange={(e) => handleManualMacroEdit(setFats, e.target.value)}
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? 'Enregistrement...' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </>
  );
}
