import type { ActivitySet, FoodCategory, Goal, Meal } from '../types';

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

/* ─── Coach intelligent — Portions par repas ─── */

/** Part de chaque categorie dans un repas (en %) */
export const CATEGORY_MEAL_SHARE: Record<FoodCategory, number> = {
  complete_dish: 0.80,
  protein: 0.35,
  starch: 0.28,
  vegetable: 0.18,
  dairy: 0.12,
  fruit: 0.15,
  snack: 1.00,
  drink: 0.15,
  sauce_condiment: 0.07,
};

/** Portion maximale realiste par categorie (en grammes) */
export const CATEGORY_MAX_PORTION: Record<FoodCategory, number> = {
  complete_dish: 450,
  protein: 200,
  starch: 250,
  vegetable: 300,
  dairy: 150,
  fruit: 200,
  snack: 80,
  drink: 400,
  sauce_condiment: 30,
};

export const CATEGORY_LABELS_FR: Record<FoodCategory, string> = {
  complete_dish: 'plat complet',
  protein: 'source de proteines',
  starch: 'feculent',
  vegetable: 'legume',
  dairy: 'produit laitier',
  fruit: 'fruit',
  snack: 'en-cas',
  drink: 'boisson',
  sauce_condiment: 'sauce/condiment',
};

const MEAL_LABELS_FR: Record<Meal['meal_type'], string> = {
  breakfast: 'petit-dejeuner',
  collation_am: 'collation du matin',
  lunch: 'dejeuner',
  collation_pm: 'collation de l\'apres-midi',
  dinner: 'diner',
};

export interface PortionRecommendation {
  recommendedGrams: number;
  recommendedCalories: number;
  allocatedCalories: number;
  mealRemaining: number;
  mealBudget: number;
  coachMessage: string;
}

export interface SmartPortionInput {
  foodName: string;
  caloriesPer100g: number;
  proteinsPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  foodCategory: FoodCategory;
  mealType: Meal['meal_type'];
  totalDailyBudget: number;
  meals: Meal[];
}

export function calculateSmartPortion(input: SmartPortionInput): PortionRecommendation {
  const {
    foodName, caloriesPer100g, foodCategory, mealType,
    totalDailyBudget, meals,
  } = input;

  // 1. Budget du repas
  const split = suggestMealSplit(totalDailyBudget);
  const mealBudget = split[mealType];

  // 2. Deja consomme pour CE repas
  const mealConsumed = meals
    .filter((m) => m.meal_type === mealType)
    .reduce((sum, m) => sum + m.calories, 0);
  const mealRemaining = Math.max(0, mealBudget - mealConsumed);

  // 3. Part de la categorie
  const isCollation = mealType === 'collation_am' || mealType === 'collation_pm';
  const categoryShare = isCollation ? 1.0 : CATEGORY_MEAL_SHARE[foodCategory];
  const allocatedCalories = Math.round(mealRemaining * categoryShare);

  // 4. Convertir en grammes (avec cap realiste par categorie)
  const maxPortion = CATEGORY_MAX_PORTION[foodCategory];
  let recommendedGrams = 0;
  let recommendedCalories = 0;
  if (caloriesPer100g > 0 && allocatedCalories > 0) {
    recommendedGrams = Math.round((allocatedCalories / caloriesPer100g) * 100);
    recommendedGrams = Math.max(10, Math.min(recommendedGrams, maxPortion));
    recommendedCalories = Math.round((recommendedGrams / 100) * caloriesPer100g);
  }

  // 5. Message coach
  const coachMessage = generateCoachMessage({
    foodName, foodCategory, mealType, isCollation,
    allocatedCalories, mealRemaining, mealBudget, mealConsumed,
    recommendedGrams, recommendedCalories,
  });

  return {
    recommendedGrams,
    recommendedCalories,
    allocatedCalories,
    mealRemaining,
    mealBudget,
    coachMessage,
  };
}

interface CoachMessageContext {
  foodName: string;
  foodCategory: FoodCategory;
  mealType: Meal['meal_type'];
  isCollation: boolean;
  allocatedCalories: number;
  mealRemaining: number;
  mealBudget: number;
  mealConsumed: number;
  recommendedGrams: number;
  recommendedCalories: number;
}

function generateCoachMessage(ctx: CoachMessageContext): string {
  const mealLabel = MEAL_LABELS_FR[ctx.mealType];
  const categoryLabel = CATEGORY_LABELS_FR[ctx.foodCategory];
  const sharePercent = Math.round(CATEGORY_MEAL_SHARE[ctx.foodCategory] * 100);
  const remaining = ctx.mealRemaining - ctx.recommendedCalories;

  // Budget epuise
  if (ctx.mealRemaining <= 0) {
    return `Tu as atteint ton budget pour le ${mealLabel} (${ctx.mealBudget} kcal). Choisis un autre repas ou une petite portion.`;
  }

  // Collation
  if (ctx.isCollation) {
    return `Pour ta ${mealLabel}, tu as ${ctx.mealRemaining} kcal disponibles. Je te conseille ${ctx.recommendedGrams}g de ${ctx.foodName} (${ctx.recommendedCalories} kcal).`;
  }

  // Plat complet
  if (ctx.foodCategory === 'complete_dish') {
    return `${ctx.foodName} est un ${categoryLabel} (~${sharePercent}% du repas). Je te conseille ${ctx.recommendedGrams}g (${ctx.recommendedCalories} kcal), ce qui te laisse de la place pour un accompagnement ou un dessert.`;
  }

  // Sauce/condiment
  if (ctx.foodCategory === 'sauce_condiment') {
    return `${ctx.foodName} est un ${categoryLabel} — petite portion conseillee : ${ctx.recommendedGrams}g (${ctx.recommendedCalories} kcal). Il te reste ${Math.max(0, remaining)} kcal pour le reste du ${mealLabel}.`;
  }

  // Autres categories
  return `${ctx.foodName} est une ${categoryLabel} (~${sharePercent}% du repas). Je te conseille ${ctx.recommendedGrams}g (${ctx.recommendedCalories} kcal) pour ton ${mealLabel}, ce qui te laisse ${Math.max(0, remaining)} kcal pour le reste du repas.`;
}

/**
 * Infere la categorie d'un aliment a partir de son nom et ses macros.
 * Utilise pour AddMealModal ou les aliments n'ont pas de categorie IA.
 */
export function inferFoodCategory(
  name: string,
  cal: number,
  prot: number,
  carbs: number,
  fats: number,
): FoodCategory {
  const n = name.toLowerCase();

  // Detection par mots-cles
  if (/\b(pizza|lasagne|couscous|tajine|gratin|hachis|paella|risotto|quiche|burger|sandwich|wrap|bowl|poke|salade compos)/i.test(n)) return 'complete_dish';
  if (/\b(poulet|boeuf|veau|porc|agneau|dinde|canard|poisson|saumon|thon|crevette|oeuf|tofu|seitan|tempeh|jambon|steak|filet|escalope|merlu|cabillaud|sardine)/i.test(n)) return 'protein';
  if (/\b(riz|pate|pain|pomme de terre|patate|semoule|quinoa|boulgour|lentille|haricot sec|pois chiche|frite|puree|baguette|cereale|avoine|flocon|tortilla|couscous sec)/i.test(n)) return 'starch';
  if (/\b(salade|tomate|carotte|brocoli|courgette|epinard|haricot vert|poivron|concombre|aubergine|chou|oignon|champignon|radis|navet|artichaut|asperge|petit pois|legume)/i.test(n)) return 'vegetable';
  if (/\b(fromage|yaourt|yogourt|lait|creme|beurre|mozzarella|emmental|camembert|chevre|compt|roquefort|parmesan)/i.test(n)) return 'dairy';
  if (/\b(pomme|banane|orange|fraise|raisin|kiwi|mangue|ananas|peche|poire|cerise|melon|pasteque|fruit|compote|abricot|prune|clementine)/i.test(n)) return 'fruit';
  if (/\b(chips|biscuit|gateau|cookie|barre|chocolat|bonbon|croissant|viennoiserie|muffin|brownie|glace|creme glacee)/i.test(n)) return 'snack';
  if (/\b(jus|soda|coca|limonade|smoothie|cafe|the|eau|boisson|lait d)/i.test(n)) return 'drink';
  if (/\b(sauce|ketchup|mayonnaise|moutarde|vinaigrette|huile|vinaigre|pesto|harissa|sriracha|soja|condiment)/i.test(n)) return 'sauce_condiment';

  // Fallback par ratio macros (sur 100g)
  if (cal <= 0) return 'complete_dish';
  const total = prot + carbs + fats;
  if (total <= 0) return 'complete_dish';

  const protRatio = prot / total;
  const carbRatio = carbs / total;

  if (cal < 50) return 'vegetable';
  if (protRatio > 0.45) return 'protein';
  if (carbRatio > 0.65 && cal > 100) return 'starch';
  if (cal < 80 && carbRatio > 0.5) return 'fruit';

  return 'complete_dish';
}
