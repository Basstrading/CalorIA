import { useCallback, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ActivityChip, ACTIVITIES } from './ActivityChip';
import { calculateTDEE, calculateCalorieBudget, MET_VALUES } from '../../lib/calories';
import type { ActivitySet, UserProfile } from '../../types';

interface DailyPlannerProps {
  profile: UserProfile;
  onValidate: (activities: ActivitySet, tdee: number, budget: number) => Promise<boolean>;
  onEditProfile?: () => void;
}

function formatFrenchDate(): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
  const now = new Date();
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
}

type ActivityKey = string;

export function DailyPlanner({ profile, onValidate, onEditProfile }: DailyPlannerProps) {
  const [selected, setSelected] = useState<Set<ActivityKey>>(new Set());
  const [values, setValues] = useState<Record<ActivityKey, number>>(() => {
    const init: Record<string, number> = {};
    for (const a of ACTIVITIES) {
      init[a.key] = a.defaultValue;
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (key === 'journee_inactive') {
        // Inactive deselects everything else
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.clear();
          next.add(key);
        }
      } else {
        // Any other activity deselects inactive
        next.delete('journee_inactive');
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
  }, []);

  const handleValueChange = useCallback((key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Build ActivitySet from selections
  const activitySet = useMemo((): ActivitySet => {
    const set: ActivitySet = {};
    if (selected.has('journee_inactive')) {
      set.journee_inactive = true;
      return set;
    }
    for (const key of selected) {
      const val = values[key];
      if (key === 'marche') set.marche = val;
      if (key === 'footing') set.footing = val;
      if (key === 'musculation') set.musculation = val;
      if (key === 'sport_collectif') set.sport_collectif = val;
      if (key === 'travail_physique') set.travail_physique = val;
      if (key === 'travail_bureau') set.travail_bureau = val;
    }
    return set;
  }, [selected, values]);

  // Real-time TDEE calculation
  const tdee = useMemo(
    () => calculateTDEE(profile.bmr, profile.weight, activitySet),
    [profile.bmr, profile.weight, activitySet],
  );

  // Budget based on goal
  const budget = useMemo(
    () => calculateCalorieBudget(tdee, profile.goal),
    [tdee, profile.goal],
  );

  const goalLabel = profile.goal === 'lose_weight' ? 'Deficit -500'
    : profile.goal === 'gain_muscle' ? 'Surplus +300'
    : 'Maintien';

  // Per-activity calorie breakdown using NET MET (MET - 1)
  const breakdown = useMemo(() => {
    const result: { label: string; kcal: number }[] = [];
    const w = profile.weight;

    if (selected.has('journee_inactive')) {
      result.push({ label: 'Journee inactive', kcal: Math.round(profile.bmr * MET_VALUES.journee_inactive) - profile.bmr });
      return result;
    }

    for (const key of selected) {
      const val = values[key];
      let kcal = 0;
      let label = '';

      if (key === 'marche') { kcal = (MET_VALUES.marche - 1) * w * (val / 60); label = `Marche ${val}min`; }
      if (key === 'footing') { kcal = (MET_VALUES.footing - 1) * w * (val / 60); label = `Footing ${val}min`; }
      if (key === 'musculation') { kcal = (MET_VALUES.musculation - 1) * w * (val / 60); label = `Musculation ${val}min`; }
      if (key === 'sport_collectif') { kcal = (MET_VALUES.sport_collectif - 1) * w * (val / 60); label = `Sport co. ${val}min`; }
      if (key === 'travail_physique') { kcal = (MET_VALUES.travail_physique - 1) * w * val; label = `Travail physique ${val}h`; }
      if (key === 'travail_bureau') { kcal = (MET_VALUES.travail_bureau - 1) * w * val; label = `Bureau ${val}h`; }

      if (label) result.push({ label, kcal: Math.round(kcal) });
    }
    return result;
  }, [selected, values, profile.weight, profile.bmr]);

  const handleValidate = async () => {
    if (selected.size === 0) {
      setError('Selectionne au moins une activite');
      return;
    }
    setError(null);
    setSubmitting(true);
    const success = await onValidate(activitySet, tdee, budget);
    if (!success) {
      setError('Erreur lors de la sauvegarde');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen min-h-dvh p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-3">
          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Modifier mon profil"
              title="Modifier mon profil"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div>
            <p className="text-text-secondary text-sm">{formatFrenchDate()}</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Bonjour</h1>
            <p className="text-text-secondary mt-0.5">Que prevois-tu aujourd'hui ?</p>
          </div>
        </div>
      </div>

      {/* Activity chips */}
      <div className="flex flex-col gap-2">
        {ACTIVITIES.map((config) => (
          <ActivityChip
            key={config.key}
            config={config}
            selected={selected.has(config.key)}
            value={values[config.key]}
            onToggle={() => handleToggle(config.key)}
            onValueChange={(v) => handleValueChange(config.key, v)}
          />
        ))}
      </div>

      {/* Real-time result */}
      <Card className="flex flex-col items-center gap-3">
        {/* Breakdown */}
        {breakdown.length > 0 && (
          <div className="w-full flex flex-col gap-1 mb-2">
            <p className="text-xs text-text-secondary font-medium">Depense par activite</p>
            {breakdown.map((b) => (
              <div key={b.label} className="flex justify-between text-xs">
                <span className="text-text-secondary">{b.label}</span>
                <span className="text-text-primary">+{b.kcal} kcal</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-secondary">
            TDEE : {tdee.toLocaleString('fr-FR')} kcal
          </span>
          <span
            className="text-4xl font-bold text-accent transition-all duration-500"
            key={budget}
          >
            {budget.toLocaleString('fr-FR')} kcal
          </span>
          <span className="text-sm text-text-secondary">
            {selected.size > 0 ? `Budget du jour (${goalLabel})` : 'BMR au repos'}
          </span>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <p className="text-danger text-sm text-center">{error}</p>
      )}

      {/* Validate button */}
      <div className="pb-6 mt-auto">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleValidate}
          disabled={submitting}
        >
          {submitting ? 'Enregistrement...' : 'Valider ma journee'}
        </Button>
      </div>
    </div>
  );
}
