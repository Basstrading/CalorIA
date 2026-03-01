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

export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
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

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const raw: string = data.choices[0].message.content;

  // Strip markdown backticks if present
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed: FoodAnalysis = JSON.parse(cleaned);

  return parsed;
}
