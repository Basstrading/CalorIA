import type { FoodDatabaseEntry } from '../types';

const BASE_URL = 'https://world.openfoodfacts.org';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OFFProduct {
  product_name_fr?: string;
  product_name?: string;
  nutriments?: OFFNutriments;
  code?: string;
}

interface OFFSearchResponse {
  products?: OFFProduct[];
}

function mapProduct(p: OFFProduct): FoodDatabaseEntry | null {
  const name = p.product_name_fr || p.product_name;
  const kcal = p.nutriments?.['energy-kcal_100g'];
  if (!name || kcal == null) return null;

  return {
    name,
    calories_per_100g: Math.round(kcal * 10) / 10,
    proteins_per_100g: Math.round((p.nutriments?.proteins_100g ?? 0) * 10) / 10,
    carbs_per_100g: Math.round((p.nutriments?.carbohydrates_100g ?? 0) * 10) / 10,
    fats_per_100g: Math.round((p.nutriments?.fat_100g ?? 0) * 10) / 10,
    source: 'off',
    barcode: p.code,
  };
}

export async function searchOpenFoodFacts(
  query: string,
  pageSize = 5,
): Promise<FoodDatabaseEntry[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    search_terms: trimmed,
    json: '1',
    page_size: String(pageSize + 5), // fetch extra to compensate for filtered-out items
    fields: 'product_name_fr,product_name,nutriments,code',
    lc: 'fr',
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${BASE_URL}/cgi/search.pl?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data: OFFSearchResponse = await res.json();
    const results: FoodDatabaseEntry[] = [];
    for (const product of data.products ?? []) {
      if (results.length >= pageSize) break;
      const mapped = mapProduct(product);
      if (mapped) results.push(mapped);
    }
    return results;
  } catch {
    // Timeout or network error — fail silently
    return [];
  }
}

export async function lookupBarcode(
  barcode: string,
): Promise<FoodDatabaseEntry | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${BASE_URL}/api/v2/product/${barcode}?fields=product_name_fr,product_name,nutriments,code`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data: { product?: OFFProduct } = await res.json();
    if (!data.product) return null;
    return mapProduct(data.product);
  } catch {
    return null;
  }
}
