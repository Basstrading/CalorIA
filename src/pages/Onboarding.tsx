import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import {
  calculateBodyComposition,
  calculateIdealWeightRange,
  interpretBMI,
} from '../lib/calories';
import type { ProfileInput } from '../hooks/useProfile';
import type { Goal } from '../types';

interface OnboardingProps {
  onComplete: (data: ProfileInput) => Promise<boolean>;
  initialData?: ProfileInput;
}

const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: 'lose_weight', label: 'Perdre du poids', description: 'Deficit calorique de 500 kcal/jour' },
  { value: 'maintain', label: 'Maintenir', description: 'Garder ton poids actuel' },
  { value: 'gain_muscle', label: 'Prendre du muscle', description: 'Surplus calorique de 300 kcal/jour' },
];

function getCoachRecommendation(goal: Goal, bmi: number, bodyFatPercent: number, sex: 'M' | 'F'): string {
  const bfHigh = sex === 'M' ? 20 : 30;
  const bfLow = sex === 'M' ? 12 : 20;
  const isBfHigh = bodyFatPercent > bfHigh;
  const isBfLow = bodyFatPercent < bfLow;

  if (goal === 'lose_weight') {
    if (bmi >= 25 && isBfHigh)
      return 'Ton IMC et ta masse grasse sont eleves. Un deficit modere (-500 kcal) avec de la musculation preservera tes muscles tout en perdant du gras.';
    if (bmi < 25 && isBfHigh)
      return 'Ton poids est correct mais ta masse grasse est elevee. Privilegie la recomposition corporelle : musculation + leger deficit.';
    if (isBfLow)
      return 'Ta masse grasse est deja basse. Perdre davantage pourrait impacter ta sante. Envisage plutot un maintien ou une prise de muscle.';
    return 'Bon profil pour une seche. Un deficit de 500 kcal/jour te fera perdre ~0.5 kg/semaine de facon saine.';
  }

  if (goal === 'gain_muscle') {
    if (isBfHigh)
      return 'Ta masse grasse est elevee. Commence par une recomposition (maintien calorique + musculation) avant un surplus.';
    if (isBfLow)
      return 'Excellent point de depart pour une prise de muscle ! Un surplus de 300 kcal avec un bon apport en proteines maximisera tes gains.';
    return 'Bon profil pour une prise de muscle. Vise 1.6-2g de proteines/kg et un surplus modere de 300 kcal.';
  }

  // maintain
  if (isBfHigh)
    return 'En maintien, ajoute de la musculation pour ameliorer ta composition corporelle sans changer de poids.';
  if (isBfLow)
    return 'Tu es deja sec(he). Le maintien est un bon choix pour stabiliser ton physique actuel.';
  return 'Bonne composition corporelle ! Le maintien te permettra de conserver tes acquis.';
}

export function Onboarding({ onComplete, initialData }: OnboardingProps) {
  const isEditing = !!initialData;

  const [sex, setSex] = useState<'M' | 'F'>(initialData?.sex ?? 'M');
  const [age, setAge] = useState(initialData?.age?.toString() ?? '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() ?? '');
  const [height, setHeight] = useState(initialData?.height?.toString() ?? '');
  const [activityProfile, setActivityProfile] = useState<'sportif' | 'peu_sportif'>(
    initialData?.activity_profile ?? 'sportif',
  );
  const [goal, setGoal] = useState<Goal>(initialData?.goal ?? 'lose_weight');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coach analysis — computed in real time when age/weight/height are filled
  const coachAnalysis = useMemo(() => {
    const ageNum = parseInt(age, 10);
    const wNum = parseFloat(weight);
    const hNum = parseFloat(height);
    if (isNaN(ageNum) || isNaN(wNum) || isNaN(hNum) || hNum <= 0 || wNum <= 0 || ageNum <= 0)
      return null;

    const comp = calculateBodyComposition(sex, ageNum, wNum, hNum);
    const bmiInterpretation = interpretBMI(comp.bmi);
    const idealRange = calculateIdealWeightRange(hNum);
    const diff = Math.round(wNum - (idealRange.min + idealRange.max) / 2);
    const recommendation = getCoachRecommendation(goal, comp.bmi, comp.bodyFatPercent, sex);

    return { ...comp, bmiInterpretation, idealRange, diff, recommendation };
  }, [sex, age, weight, height, goal]);

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
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Modifier mon profil' : 'Bienvenue'}
          </h1>
          <p className="text-text-secondary mt-1">
            {isEditing ? 'Mets a jour tes informations' : 'Quelques infos pour commencer'}
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
        </Card>

        {/* Coach Analysis */}
        {coachAnalysis && (
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-text-primary">Analyse coach</p>

            {/* IMC */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">IMC</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: coachAnalysis.bmiInterpretation.color }}>
                  {coachAnalysis.bmi}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: coachAnalysis.bmiInterpretation.color + '20',
                    color: coachAnalysis.bmiInterpretation.color,
                  }}
                >
                  {coachAnalysis.bmiInterpretation.label}
                </span>
              </div>
            </div>

            {/* Ideal weight range */}
            <div className="bg-card border border-border rounded-card px-4 py-3 text-sm">
              <p className="text-text-secondary">
                Poids ideal : <span className="font-bold text-text-primary">{coachAnalysis.idealRange.min}-{coachAnalysis.idealRange.max} kg</span>
              </p>
              {coachAnalysis.diff > 0 && (
                <p className="text-text-secondary mt-1">{coachAnalysis.diff} kg au-dessus de la moyenne ideale</p>
              )}
              {coachAnalysis.diff < 0 && (
                <p className="text-text-secondary mt-1">{Math.abs(coachAnalysis.diff)} kg en-dessous de la moyenne ideale</p>
              )}
              {coachAnalysis.diff === 0 && (
                <p className="text-accent mt-1 font-medium">Tu es a ton poids ideal !</p>
              )}
            </div>

            {/* Body composition grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card border border-border rounded-card px-3 py-2 text-center">
                <p className="text-xs text-text-secondary">Masse grasse</p>
                <p className="text-lg font-bold text-text-primary">{coachAnalysis.bodyFatPercent}%</p>
              </div>
              <div className="bg-card border border-border rounded-card px-3 py-2 text-center">
                <p className="text-xs text-text-secondary">Masse maigre</p>
                <p className="text-lg font-bold text-text-primary">{coachAnalysis.leanMass} kg</p>
              </div>
              <div className="bg-card border border-border rounded-card px-3 py-2 text-center">
                <p className="text-xs text-text-secondary">Masse musculaire</p>
                <p className="text-lg font-bold text-text-primary">{coachAnalysis.muscleMass} kg</p>
              </div>
              <div className="bg-card border border-border rounded-card px-3 py-2 text-center">
                <p className="text-xs text-text-secondary">Poids actuel</p>
                <p className="text-lg font-bold text-text-primary">{parseFloat(weight)} kg</p>
              </div>
            </div>

            {/* Coach recommendation */}
            <div className="bg-accent-soft border border-accent/20 rounded-card px-4 py-3">
              <p className="text-xs font-semibold text-accent mb-1">Recommandation coach</p>
              <p className="text-sm text-text-primary leading-relaxed">{coachAnalysis.recommendation}</p>
            </div>
          </Card>
        )}

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
            {submitting ? 'Enregistrement...' : isEditing ? 'Mettre a jour' : 'C\'est parti !'}
          </Button>
        </div>
      </div>
    </div>
  );
}
