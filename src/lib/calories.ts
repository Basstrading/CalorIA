import type { ActivitySet } from '../types';

/**
 * Valeurs MET (Metabolic Equivalent of Task) pour chaque activité.
 * 1 MET = 1 kcal/kg/h au repos.
 * Sources : Compendium of Physical Activities (Ainsworth et al.)
 */
export const MET_VALUES = {
  marche: 3.5,           // marche rapide ~5 km/h
  footing: 7.0,          // course modérée ~8 km/h
  musculation: 6.0,      // entraînement résistance
  sport_collectif: 8.0,  // foot, basket, etc.
  travail_physique: 4.0,  // travail manuel (debout, port de charges)
  travail_bureau: 1.5,    // assis, ordinateur
  journee_inactive: 1.2,  // repos, canapé, TV
} as const;

/**
 * Calcul du métabolisme de base (BMR) via la formule Mifflin-St Jeor.
 * Considérée comme la plus précise pour les adultes en bonne santé.
 *
 * Homme : BMR = 10×poids(kg) + 6.25×taille(cm) - 5×âge(ans) + 5
 * Femme : BMR = 10×poids(kg) + 6.25×taille(cm) - 5×âge(ans) - 161
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
 * Pour chaque activité déclarée, on calcule les calories brûlées :
 *   calories = MET × poids(kg) × durée(heures)
 *
 * Le TDEE final = BMR + somme des calories brûlées par activité.
 * On utilise le MET brut (pas MET-1) conformément à l'approche
 * grand public des apps fitness.
 */
export function calculateTDEE(
  bmr: number,
  weight: number,
  activities: ActivitySet,
): number {
  let activityCalories = 0;

  // Activités en minutes → convertir en heures
  if (activities.marche) {
    activityCalories += MET_VALUES.marche * weight * (activities.marche / 60);
  }
  if (activities.footing) {
    activityCalories += MET_VALUES.footing * weight * (activities.footing / 60);
  }
  if (activities.musculation) {
    activityCalories += MET_VALUES.musculation * weight * (activities.musculation / 60);
  }
  if (activities.sport_collectif) {
    activityCalories += MET_VALUES.sport_collectif * weight * (activities.sport_collectif / 60);
  }

  // Activités en heures (travail)
  if (activities.travail_physique) {
    activityCalories += MET_VALUES.travail_physique * weight * activities.travail_physique;
  }
  if (activities.travail_bureau) {
    activityCalories += MET_VALUES.travail_bureau * weight * activities.travail_bureau;
  }

  // Journée inactive : coefficient multiplicateur simple sur le BMR
  if (activities.journee_inactive) {
    return Math.round(bmr * MET_VALUES.journee_inactive);
  }

  return Math.round(bmr + activityCalories);
}

/**
 * Répartition suggérée du budget calorique par repas.
 * Basée sur les recommandations nutritionnelles courantes :
 *   - Petit-déjeuner : 25%
 *   - Déjeuner : 35%
 *   - Dîner : 30%
 *   - Snack : 10%
 */
export function suggestMealSplit(totalCalories: number): {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
} {
  return {
    breakfast: Math.round(totalCalories * 0.25),
    lunch: Math.round(totalCalories * 0.35),
    dinner: Math.round(totalCalories * 0.30),
    snack: Math.round(totalCalories * 0.10),
  };
}
