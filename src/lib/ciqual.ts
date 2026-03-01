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

    // Count how many tokens match at a word boundary
    let matchedTokens = 0;
    let totalIndex = 0;
    for (const token of tokens) {
      let searchFrom = 0;
      while (searchFrom <= name.length - token.length) {
        const idx = name.indexOf(token, searchFrom);
        if (idx === -1) break;
        if (idx === 0 || !/[a-z]/.test(name[idx - 1])) {
          totalIndex += idx;
          matchedTokens++;
          break;
        }
        searchFrom = idx + 1;
      }
    }
    if (matchedTokens === 0) continue;

    // Score: full matches first (lower = better), then partial matches
    // Penalty of 10000 per missing token ensures full matches always rank first
    const missingPenalty = (tokens.length - matchedTokens) * 10000;
    const score = missingPenalty + name.length + totalIndex;
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
