import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import type { ProfileInput } from '../hooks/useProfile';
import type { Goal } from '../types';

interface OnboardingProps {
  onComplete: (data: ProfileInput) => Promise<boolean>;
}

const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: 'lose_weight', label: 'Perdre du poids', description: 'Deficit calorique de 500 kcal/jour' },
  { value: 'maintain', label: 'Maintenir', description: 'Garder ton poids actuel' },
  { value: 'gain_muscle', label: 'Prendre du muscle', description: 'Surplus calorique de 300 kcal/jour' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityProfile, setActivityProfile] = useState<'sportif' | 'peu_sportif'>('sportif');
  const [goal, setGoal] = useState<Goal>('lose_weight');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const idealWeight = !isNaN(heightNum) && heightNum > 0
    ? Math.round(22 * (heightNum / 100) ** 2)
    : null;
  const weightDiff = idealWeight !== null && !isNaN(weightNum)
    ? Math.round(weightNum - idealWeight)
    : null;

  const validate = (): ProfileInput | null => {
    const ageNum = parseInt(age, 10);
    const wNum = parseFloat(weight);
    const hNum = parseFloat(height);

    if (!age || !weight || !height) {
      setError('Tous les champs sont obligatoires');
      return null;
    }
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 119) {
      setError('L\'age doit etre entre 1 et 119 ans');
      return null;
    }
    if (isNaN(wNum) || wNum <= 20 || wNum >= 300) {
      setError('Le poids doit etre entre 21 et 299 kg');
      return null;
    }
    if (isNaN(hNum) || hNum <= 100 || hNum >= 250) {
      setError('La taille doit etre entre 101 et 249 cm');
      return null;
    }

    return {
      sex,
      age: ageNum,
      weight: wNum,
      height: hNum,
      activity_profile: activityProfile,
      goal,
    };
  };

  const handleSubmit = async () => {
    setError(null);
    const data = validate();
    if (!data) return;

    setSubmitting(true);
    const success = await onComplete(data);
    if (!success) {
      setError('Erreur lors de la sauvegarde. Veuillez reessayer.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen min-h-dvh p-6 flex flex-col">
      <div className="flex-1 flex flex-col gap-6">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenue</h1>
          <p className="text-text-secondary mt-1">
            Quelques infos pour commencer
          </p>
        </div>

        {/* Sexe */}
        <Card>
          <p className="text-sm text-text-secondary font-medium mb-3">Sexe</p>
          <Toggle
            options={[
              { value: 'M' as const, label: 'Homme' },
              { value: 'F' as const, label: 'Femme' },
            ]}
            value={sex}
            onChange={setSex}
          />
        </Card>

        {/* Age, Poids, Taille */}
        <Card className="flex flex-col gap-4">
          <Input
            id="age"
            label="Age"
            type="number"
            inputMode="numeric"
            placeholder="25"
            min={1}
            max={119}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <Input
            id="weight"
            label="Poids"
            type="number"
            inputMode="decimal"
            placeholder="70"
            min={20}
            max={300}
            suffix="kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            id="height"
            label="Taille"
            type="number"
            inputMode="numeric"
            placeholder="175"
            min={100}
            max={250}
            suffix="cm"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />

          {/* Poids ideal */}
          {idealWeight !== null && weightDiff !== null && (
            <div className="bg-card border border-border rounded-card px-4 py-3 text-sm">
              <p className="text-text-secondary">
                Poids ideal (IMC 22) : <span className="font-bold text-text-primary">{idealWeight} kg</span>
              </p>
              {weightDiff > 0 && (
                <p className="text-text-secondary mt-1">
                  {weightDiff} kg a perdre
                </p>
              )}
              {weightDiff < 0 && (
                <p className="text-text-secondary mt-1">
                  {Math.abs(weightDiff)} kg a prendre
                </p>
              )}
              {weightDiff === 0 && (
                <p className="text-accent mt-1 font-medium">
                  Tu es a ton poids ideal !
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Objectif */}
        <Card>
          <p className="text-sm text-text-secondary font-medium mb-3">Mon objectif</p>
          <div className="flex flex-col gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoal(opt.value)}
                className={`flex flex-col items-start px-4 py-3 rounded-button text-left transition-all border ${
                  goal === opt.value
                    ? 'bg-accent-soft border-accent/40'
                    : 'bg-card border-border'
                }`}
              >
                <span className={`text-sm font-semibold ${
                  goal === opt.value ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {opt.label}
                </span>
                <span className="text-xs text-text-secondary mt-0.5">{opt.description}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Profil activite */}
        <Card>
          <p className="text-sm text-text-secondary font-medium mb-3">Profil d'activite</p>
          <Toggle
            options={[
              { value: 'sportif' as const, label: 'Sportif' },
              { value: 'peu_sportif' as const, label: 'Peu sportif' },
            ]}
            value={activityProfile}
            onChange={setActivityProfile}
          />
        </Card>

        {/* Erreur */}
        {error && (
          <p className="text-danger text-sm text-center">{error}</p>
        )}

        {/* Bouton */}
        <div className="pb-6 mt-auto">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Enregistrement...' : 'C\'est parti !'}
          </Button>
        </div>
      </div>
    </div>
  );
}
