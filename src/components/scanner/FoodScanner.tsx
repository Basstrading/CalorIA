import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Slider } from '../ui/Slider';
import { fileToBase64 } from '../../lib/image';
import { analyzeFood } from '../../lib/openrouter';
import type { FoodAnalysis, Meal } from '../../types';

type MealType = Meal['meal_type'];
type Screen = 'capture' | 'analyzing' | 'result';

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Petit-dej', emoji: '\u{2615}' },
  { value: 'lunch', label: 'Dejeuner', emoji: '\u{1F37D}' },
  { value: 'dinner', label: 'Diner', emoji: '\u{1F319}' },
  { value: 'snack', label: 'Snack', emoji: '\u{1F34E}' },
];

interface FoodScannerProps {
  planId: string;
  budget: number;
  totalCaloriesToday: number;
  onAddMeal: (data: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onClose: () => void;
}

export function FoodScanner({
  planId,
  budget,
  totalCaloriesToday,
  onAddMeal,
  onClose,
}: FoodScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [screen, setScreen] = useState<Screen>('capture');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields for low-confidence results
  const [editedName, setEditedName] = useState('');
  const [editedCalories, setEditedCalories] = useState('');

  // Result screen state
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [quantity, setQuantity] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
      setScreen('analyzing');

      const result = await analyzeFood(base64);
      setAnalysis(result);
      setEditedName(result.food_name);
      setEditedCalories(String(result.calories_per_100g));

      // Calculate default quantity
      const caloriesRestantes = Math.max(0, budget - totalCaloriesToday);
      const grammesMax = result.calories_per_100g > 0
        ? Math.round((caloriesRestantes / result.calories_per_100g) * 100)
        : 100;
      const clamped = Math.max(10, Math.min(grammesMax, 1000));
      setQuantity(clamped);

      setScreen('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setScreen('capture');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleRetry = () => {
    setError(null);
    setImageBase64(null);
    setAnalysis(null);
    setScreen('capture');
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaveError(null);
    setSubmitting(true);

    const calPer100 = analysis.confidence === 'low'
      ? (parseFloat(editedCalories) || analysis.calories_per_100g)
      : analysis.calories_per_100g;
    const foodName = analysis.confidence === 'low'
      ? (editedName.trim() || analysis.food_name)
      : analysis.food_name;

    const ratio = quantity / 100;
    try {
      const success = await onAddMeal({
        plan_id: planId,
        meal_type: mealType,
        food_name: foodName,
        calories: Math.round(calPer100 * ratio),
        proteins: Math.round(analysis.proteins_per_100g * ratio),
        carbs: Math.round(analysis.carbs_per_100g * ratio),
        fats: Math.round(analysis.fats_per_100g * ratio),
        quantity_grams: quantity,
      });

      if (success) {
        onClose();
      } else {
        setSaveError('Erreur lors de la sauvegarde');
      }
    } catch {
      setSaveError('Erreur lors de la sauvegarde');
    }
    setSubmitting(false);
  };

  // Computed values for result screen
  const calPer100 = analysis
    ? (analysis.confidence === 'low'
      ? (parseFloat(editedCalories) || analysis.calories_per_100g)
      : analysis.calories_per_100g)
    : 0;
  const caloriesRestantes = Math.max(0, budget - totalCaloriesToday);
  const grammesMax = calPer100 > 0
    ? Math.round((caloriesRestantes / calPer100) * 100)
    : 100;
  const sliderMax = Math.max(Math.round(grammesMax * 1.5), 100);
  const ratio = quantity / 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-dark rounded-t-[20px] max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="max-w-md mx-auto p-6 flex flex-col gap-5">
          {/* Handle */}
          <div className="flex justify-center">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Screen 1: Capture */}
          {screen === 'capture' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <h2 className="text-xl font-bold">Scanner un aliment</h2>
              <p className="text-text-secondary text-sm text-center">
                Prends en photo ton plat et l'IA estimera ses valeurs nutritionnelles
              </p>

              {/* Camera button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-accent flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="text-sm text-accent font-medium"
              >
                Choisir depuis la galerie
              </button>

              {error && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-danger text-sm text-center">{error}</p>
                  <Button variant="secondary" onClick={handleRetry}>
                    Reessayer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Screen 2: Analyzing */}
          {screen === 'analyzing' && (
            <div className="flex flex-col items-center gap-5 py-4 relative">
              {imageBase64 && (
                <div className="w-full h-48 rounded-card overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${imageBase64}`}
                    alt="Photo de l'aliment"
                    className="w-full h-full object-cover blur-sm opacity-60"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-text-primary font-semibold">Analyse en cours...</p>
              </div>
            </div>
          )}

          {/* Screen 3: Result */}
          {screen === 'result' && analysis && (
            <div className="flex flex-col gap-4">
              {/* Image preview */}
              {imageBase64 && (
                <div className="w-full h-36 rounded-card overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${imageBase64}`}
                    alt="Photo de l'aliment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Food name + confidence */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold flex-1">{analysis.food_name}</h2>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  analysis.confidence === 'high'
                    ? 'bg-green-500/20 text-green-400'
                    : analysis.confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                }`}>
                  {analysis.confidence === 'high' ? 'Fiable' :
                    analysis.confidence === 'medium' ? 'Probable' : 'Incertain'}
                </span>
              </div>

              {/* Low confidence warning */}
              {analysis.confidence === 'low' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-card p-3 flex flex-col gap-3">
                  <p className="text-red-400 text-xs">
                    L'identification est incertaine. Tu peux corriger le nom et les calories ci-dessous.
                  </p>
                  <Input
                    id="edit-name"
                    label="Nom de l'aliment"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                  <Input
                    id="edit-cal"
                    label="Calories / 100g"
                    type="number"
                    inputMode="numeric"
                    suffix="kcal"
                    value={editedCalories}
                    onChange={(e) => setEditedCalories(e.target.value)}
                  />
                </div>
              )}

              {/* Nutritional info per 100g */}
              <Card className="p-4">
                <p className="text-xs text-text-secondary mb-3">Valeurs pour 100g</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-accent">{analysis.calories_per_100g}</p>
                    <p className="text-[10px] text-text-secondary">kcal</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{analysis.proteins_per_100g}g</p>
                    <p className="text-[10px] text-text-secondary">Prot.</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{analysis.carbs_per_100g}g</p>
                    <p className="text-[10px] text-text-secondary">Gluc.</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{analysis.fats_per_100g}g</p>
                    <p className="text-[10px] text-text-secondary">Lip.</p>
                  </div>
                </div>
              </Card>

              {/* Recommendation */}
              <Card className="p-4 border border-accent/20">
                <p className="text-sm text-text-secondary mb-1">Budget restant</p>
                <p className="text-lg font-bold text-accent">{caloriesRestantes} kcal</p>
                <p className="text-sm mt-2">
                  Tu peux manger jusqu'a <span className="font-bold text-accent">{grammesMax}g</span>
                </p>
              </Card>

              {/* Quantity slider */}
              <div>
                <p className="text-sm text-text-secondary mb-2">Quantite souhaitee</p>
                <Slider
                  min={0}
                  max={sliderMax}
                  step={10}
                  value={quantity}
                  onChange={setQuantity}
                  unit="g"
                />
              </div>

              {/* Dynamic macro display for chosen quantity */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-accent">
                    {Math.round(calPer100 * ratio)}
                  </p>
                  <p className="text-[10px] text-text-secondary">kcal</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {Math.round(analysis.proteins_per_100g * ratio)}g
                  </p>
                  <p className="text-[10px] text-text-secondary">Prot.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {Math.round(analysis.carbs_per_100g * ratio)}g
                  </p>
                  <p className="text-[10px] text-text-secondary">Gluc.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {Math.round(analysis.fats_per_100g * ratio)}g
                  </p>
                  <p className="text-[10px] text-text-secondary">Lip.</p>
                </div>
              </div>

              {/* Meal type chips */}
              <div>
                <p className="text-sm text-text-secondary mb-2">Type de repas</p>
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
              </div>

              {saveError && (
                <p className="text-danger text-sm text-center">{saveError}</p>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={handleSave}
                disabled={submitting || quantity === 0}
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer ce repas'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
