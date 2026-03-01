import type { FoodAnalysis, Goal, Meal, RecipeSuggestion } from '../types';

// TODO: Move API key to backend for production — exposing it in the client is insecure
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es un nutritionniste expert. On te montre une photo d'aliment ou de plat.
Reponds UNIQUEMENT avec un objet JSON (sans backticks, sans texte autour) au format :
{
  "food_name": "Nom de l'aliment en francais",
  "calories_per_100g": nombre,
  "proteins_per_100g": nombre,
  "carbs_per_100g": nombre,
  "fats_per_100g": nombre,
  "confidence": "high" | "medium" | "low",
  "food_category": "complete_dish" | "protein" | "starch" | "vegetable" | "dairy" | "fruit" | "snack" | "drink" | "sauce_condiment"
}
- Les valeurs nutritionnelles sont pour 100g.
- "confidence" indique ta certitude sur l'identification : "high" si tu es sur, "medium" si probable, "low" si incertain.
- "food_category" indique la categorie de l'aliment :
  - "complete_dish" : plat complet (ex: couscous, pizza, lasagne, salade composee)
  - "protein" : source de proteines (ex: poulet, boeuf, poisson, oeufs, tofu)
  - "starch" : feculent/glucides (ex: riz, pates, pain, pomme de terre, quinoa)
  - "vegetable" : legume (ex: brocoli, carotte, salade verte, courgette)
  - "dairy" : produit laitier (ex: fromage, yaourt, lait)
  - "fruit" : fruit (ex: pomme, banane, fraises, orange)
  - "snack" : en-cas/snack (ex: barre cereales, chips, biscuit, chocolat)
  - "drink" : boisson (ex: jus, soda, smoothie, cafe au lait)
  - "sauce_condiment" : sauce ou condiment (ex: ketchup, mayonnaise, vinaigrette, huile d'olive)
- Utilise des valeurs realistes basees sur les tables nutritionnelles standard.`;

const TIMEOUT_MS = 30_000;

export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CalorIA',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
              {
                type: 'text',
                text: 'Analyse cet aliment et donne-moi ses valeurs nutritionnelles pour 100g.',
              },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Delai depasse — verifie ta connexion et reessaie.');
    }
    throw new Error('Erreur reseau — verifie ta connexion.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) — reessaie plus tard.`);
  }

  const data = await response.json();

  // Validate response shape
  const raw: string | undefined = data?.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('Reponse inattendue du serveur.');
  }

  // Strip markdown backticks if present, then parse JSON
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: FoodAnalysis;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('L\'IA n\'a pas retourne un format valide. Reessaie avec une autre photo.');
  }

  // Validate required fields
  if (
    typeof parsed.food_name !== 'string' ||
    typeof parsed.calories_per_100g !== 'number' ||
    typeof parsed.proteins_per_100g !== 'number' ||
    typeof parsed.carbs_per_100g !== 'number' ||
    typeof parsed.fats_per_100g !== 'number'
  ) {
    throw new Error('Donnees nutritionnelles incompletes. Reessaie avec une photo plus nette.');
  }

  // Normalize confidence
  if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
    parsed.confidence = 'low';
  }

  // Normalize food_category
  const VALID_CATEGORIES = [
    'complete_dish', 'protein', 'starch', 'vegetable', 'dairy',
    'fruit', 'snack', 'drink', 'sauce_condiment',
  ];
  if (!VALID_CATEGORIES.includes(parsed.food_category)) {
    parsed.food_category = 'complete_dish';
  }

  return parsed;
}

const MEAL_TYPES_FR: Record<Meal['meal_type'], string> = {
  breakfast: 'petit-dejeuner',
  collation_am: 'collation du matin',
  lunch: 'dejeuner',
  collation_pm: 'collation de l\'apres-midi',
  dinner: 'diner',
};

export interface CoachContext {
  goal: Goal;
  weight: number;
  height: number;
  sex: 'M' | 'F';
  totalDailyBudget: number;
  availableCalories: number;
  mealType: Meal['meal_type'];
}

function getGoalStrategy(goal: Goal): string {
  switch (goal) {
    case 'lose_weight':
      return `OBJECTIF : PERTE DE POIDS
- Strategie : deficit calorique maitrise, haute densite nutritionnelle
- Ratios macro : 30-35% proteines, 35-40% glucides, 25-30% lipides
- Privilegier : fibres, proteines maigres, legumes volumineux, aliments a faible densite calorique
- Eviter : sucres rapides, aliments ultra-transformes, calories vides
- Chaque repas doit etre rassasiant malgre le deficit`;
    case 'gain_muscle':
      return `OBJECTIF : PRISE DE MUSCLE
- Strategie : surplus calorique controle, proteines elevees (min 1.6g/kg de poids)
- Ratios macro : 25-30% proteines, 45-50% glucides, 20-25% lipides
- Privilegier : proteines completes, glucides complexes, bonnes graisses
- Timing : glucides autour de l'entrainement, proteines a chaque repas
- Les repas doivent soutenir la recuperation et la croissance musculaire`;
    case 'maintain':
    default:
      return `OBJECTIF : MAINTIEN DU POIDS
- Strategie : equilibre nutritionnel, variete alimentaire
- Ratios macro : 25% proteines, 45-50% glucides, 25-30% lipides
- Privilegier : diversite des sources, plaisir alimentaire, aliments complets
- Les repas doivent etre equilibres et agreables`;
  }
}

export async function getRecipeSuggestions(
  context: CoachContext,
): Promise<RecipeSuggestion[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const sexLabel = context.sex === 'M' ? 'Homme' : 'Femme';
  const goalStrategy = getGoalStrategy(context.goal);
  const mealLabel = MEAL_TYPES_FR[context.mealType];

  const systemPrompt = `Tu es un coach nutritionniste d'elite, specialise en nutrition sportive et gestion du poids.
Tu elabores des plans alimentaires personnalises avec precision.

PROFIL CLIENT :
- Sexe : ${sexLabel}
- Poids : ${context.weight} kg
- Taille : ${context.height} cm
- Budget calorique total journalier : ${context.totalDailyBudget} kcal

${goalStrategy}

REGLES STRICTES :
- Chaque suggestion doit totaliser environ ${context.availableCalories} kcal (tolerance +/- 10%)
- Indique les quantites precises en grammes pour chaque ingredient
- Les macros (proteines, glucides, lipides) doivent respecter les ratios ci-dessus
- Propose des repas realistes, faciles a preparer, avec des ingredients courants
- Descriptions courtes et motivantes (1 phrase)`;

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CalorIA',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Propose exactement 3 idees pour mon ${mealLabel} avec ${context.availableCalories} kcal disponibles.

Reponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks :
[
  {
    "name": "Nom du repas",
    "description": "Description courte et motivante (1 phrase)",
    "calories": nombre entier,
    "proteins": nombre entier en grammes,
    "carbs": nombre entier en grammes,
    "fats": nombre entier en grammes,
    "ingredients": ["ingredient 1 (quantite en g)", "ingredient 2 (quantite en g)", "..."]
  }
]`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Delai depasse — verifie ta connexion et reessaie.');
    }
    throw new Error('Erreur reseau — verifie ta connexion.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) — reessaie plus tard.`);
  }

  const data = await response.json();
  const raw: string | undefined = data?.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('Reponse inattendue du serveur.');
  }

  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: RecipeSuggestion[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('L\'IA n\'a pas retourne un format valide. Reessaie.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Aucune suggestion recue. Reessaie.');
  }

  return parsed;
}
