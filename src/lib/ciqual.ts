import type { CiqualRawEntry, FoodDatabaseEntry } from '../types';

let cache: CiqualRawEntry[] | null = null;

async function loadData(): Promise<CiqualRawEntry[]> {
  if (cache) return cache;
  const mod = await import('../data/ciqual.json');
  cache = mod.default as CiqualRawEntry[];
  return cache;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export async function searchCiqual(
  query: string,
  limit = 5,
): Promise<FoodDatabaseEntry[]> {
  const data = await loadData();
  const raw = normalize(query.trim());
  if (!raw) return [];

  const tokens = raw.split(/\s+/);

  const scored: { entry: CiqualRawEntry; score: number }[] = [];

  for (const entry of data) {
    const name = normalize(entry.alim_nom_fr);

    // All tokens must match somewhere in the name
    let allMatch = true;
    let totalIndex = 0;
    for (const token of tokens) {
      const idx = name.indexOf(token);
      if (idx === -1) {
        allMatch = false;
        break;
      }
      totalIndex += idx;
    }
    if (!allMatch) continue;

    // Score: prefer shorter names (more specific) and earlier matches
    const score = name.length + totalIndex;
    scored.push({ entry, score });
  }

  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map(({ entry }) => ({
    name: entry.alim_nom_fr,
    calories_per_100g: entry.energie_kcal,
    proteins_per_100g: entry.proteines,
    carbs_per_100g: entry.glucides,
    fats_per_100g: entry.lipides,
    source: 'ciqual',
  }));
}
