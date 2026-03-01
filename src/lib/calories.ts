import type { ActivitySet, Goal } from '../types';

/**
 * Valeurs MET (Metabolic Equivalent of Task) pour chaque activite.
 * 1 MET = 1 kcal/kg/h au repos.
 * Sources : Compendium of Physical Activities (Ainsworth et al.)
 */
export const MET_VALUES = {
  marche: 3.5,           // marche rapide ~5 km/h
  footing: 7.0,          // course moderee ~8 km/h
  musculation: 6.0,      // entrainement resistance
  sport_collectif: 8.0,  // foot, basket, etc.
  travail_physique: 4.0,  // travail manuel (debout, port de charges)
  travail_bureau: 1.5,    // assis, ordinateur
  journee_inactive: 1.2,  // repos, canape, TV
} as const;

/**
 * Calcul du metabolisme de base (BMR) via la formule Mifflin-St Jeor.
 * Consideree comme la plus precise pour les adultes en bonne sante.
 *
 * Homme : BMR = 10*poids(kg) + 6.25*taille(cm) - 5*age(ans) + 5
 * Femme : BMR = 10*poids(kg) + 6.25*taille(cm) - 5*age(ans) - 161
 */
export function calculateBMR(
  sex: 'M' | 'F',
  weight: number,
  height: number,
  age: number,
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === 'M' ? base + 5 : base - 161);
}

/**
 * Calcul du TDEE (Total Daily Energy Expenditure) dynamique.
 *
 * On utilise le MET NET (MET - 1) pour eviter de compter le BMR deux fois.
 * Le BMR represente deja 1 MET (depense au repos). Chaque activite ajoute
 * uniquement la depense SUPPLEMENTAIRE :
 *   calories_nettes = (MET - 1) * poids(kg) * duree(heures)
 *
 * TDEE = BMR + somme des calories nettes par activite
 */
export function calculateTDEE(
  bmr: number,
  weight: number,
  activities: ActivitySet,
): number {
  let activityCalories = 0;

  // Journee inactive : coefficient multiplicateur simple sur le BMR
  if (activities.journee_inactive) {
    return Math.round(bmr * MET_VALUES.journee_inactive);
  }

  // Activites en minutes -> convertir en heures, MET NET = MET - 1
  if (activities.marche) {
    activityCalories += (MET_VALUES.marche - 1) * weight * (activities.marche / 60);
  }
  if (activities.footing) {
    activityCalories += (MET_VALUES.footing - 1) * weight * (activities.footing / 60);
  }
  if (activities.musculation) {
    activityCalories += (MET_VALUES.musculation - 1) * weight * (activities.musculation / 60);
  }
  if (activities.sport_collectif) {
    activityCalories += (MET_VALUES.sport_collectif - 1) * weight * (activities.sport_collectif / 60);
  }

  // Activites en heures (travail), MET NET = MET - 1
  if (activities.travail_physique) {
    activityCalories += (MET_VALUES.travail_physique - 1) * weight * activities.travail_physique;
  }
  if (activities.travail_bureau) {
    activityCalories += (MET_VALUES.travail_bureau - 1) * weight * activities.travail_bureau;
  }

  return Math.round(bmr + activityCalories);
}

/**
 * Calcule le budget calorique journalier en fonction de l'objectif.
 * - Perte de poids : deficit de 500 kcal
 * - Prise de muscle : surplus de 300 kcal
 * - Maintien : TDEE tel quel
 */
export function calculateCalorieBudget(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose_weight':
      return Math.round(tdee - 500);
    case 'gain_muscle':
      return Math.round(tdee + 300);
    case 'maintain':
    default:
      return tdee;
  }
}

/**
 * Repartition suggeree du budget calorique par repas (5 types).
 *   - Petit-dejeuner : 20%
 *   - Collation matin : 10%
 *   - Dejeuner : 30%
 *   - Collation apres-midi : 10%
 *   - Diner : 30%
 */
export function suggestMealSplit(totalCalories: number): {
  breakfast: number;
  collation_am: number;
  lunch: number;
  collation_pm: number;
  dinner: number;
} {
  return {
    breakfast: Math.round(totalCalories * 0.20),
    collation_am: Math.round(totalCalories * 0.10),
    lunch: Math.round(totalCalories * 0.30),
    collation_pm: Math.round(totalCalories * 0.10),
    dinner: Math.round(totalCalories * 0.30),
  };
}

/* ─── Composition corporelle ─── */

/** Calcul de l'IMC (Indice de Masse Corporelle). */
export function calculateBMI(weight: number, height: number): number {
  const h = height / 100;
  return weight / (h * h);
}

/** Interpretation de l'IMC avec label et couleur. */
export function interpretBMI(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Insuffisance ponderale', color: '#f59e0b' };
  if (bmi < 25) return { label: 'Normal', color: '#22c55e' };
  if (bmi < 30) return { label: 'Surpoids', color: '#f59e0b' };
  return { label: 'Obesite', color: '#ef4444' };
}

/** Fourchette de poids ideal basee sur un IMC entre 20 et 25. */
export function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const h = height / 100;
  return {
    min: Math.round(20 * h * h),
    max: Math.round(25 * h * h),
  };
}

/**
 * Estimation de la composition corporelle.
 * Masse grasse via la formule de Deurenberg :
 *   BF% = 1.20 * IMC + 0.23 * age - 10.8 * sex_factor - 5.4
 *   sex_factor : 1 pour homme, 0 pour femme.
 */
export function calculateBodyComposition(
  sex: 'M' | 'F',
  age: number,
  weight: number,
  height: number,
): { bmi: number; bodyFatPercent: number; leanMass: number; muscleMass: number } {
  const bmi = calculateBMI(weight, height);
  const sexFactor = sex === 'M' ? 1 : 0;
  let bodyFatPercent = 1.20 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4;
  bodyFatPercent = Math.max(3, Math.min(60, bodyFatPercent));
  const leanMass = weight * (1 - bodyFatPercent / 100);
  const muscleMass = leanMass * 0.4;
  return {
    bmi: Math.round(bmi * 10) / 10,
    bodyFatPercent: Math.round(bodyFatPercent * 10) / 10,
    leanMass: Math.round(leanMass * 10) / 10,
    muscleMass: Math.round(muscleMass * 10) / 10,
  };
}
