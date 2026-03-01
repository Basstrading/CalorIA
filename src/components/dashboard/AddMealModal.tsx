import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Meal } from '../../types';

type MealType = Meal['meal_type'];

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Petit-dej', emoji: '\u{2615}' },
  { value: 'lunch', label: 'Dejeuner', emoji: '\u{1F37D}' },
  { value: 'dinner', label: 'Diner', emoji: '\u{1F319}' },
  { value: 'snack', label: 'Snack', emoji: '\u{1F34E}' },
];

interface AddMealModalProps {
  planId: string;
  onSave: (data: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onClose: () => void;
}

export function AddMealModal({ planId, onSave, onClose }: AddMealModalProps) {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          {/* Handle */}
          <div className="flex justify-center">
            <div className="w-10 h-1 rounded-full bg-border" />
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

          {/* Inputs */}
          <Input
            id="food-name"
            label="Aliment"
            placeholder="Ex: Poulet grille"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
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
              onChange={(e) => setCalories(e.target.value)}
            />
            <Input
              id="quantity"
              label="Quantite"
              type="number"
              inputMode="numeric"
              placeholder="200"
              suffix="g"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              id="proteins"
              label="Proteines"
              type="number"
              inputMode="decimal"
              placeholder="0"
              suffix="g"
              value={proteins}
              onChange={(e) => setProteins(e.target.value)}
            />
            <Input
              id="carbs"
              label="Glucides"
              type="number"
              inputMode="decimal"
              placeholder="0"
              suffix="g"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
            <Input
              id="fats"
              label="Lipides"
              type="number"
              inputMode="decimal"
              placeholder="0"
              suffix="g"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
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
