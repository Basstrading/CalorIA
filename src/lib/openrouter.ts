import type { FoodAnalysis } from '../types';

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
  "confidence": "high" | "medium" | "low"
}
- Les valeurs nutritionnelles sont pour 100g.
- "confidence" indique ta certitude sur l'identification : "high" si tu es sur, "medium" si probable, "low" si incertain.
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

  return parsed;
}
