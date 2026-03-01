const params = new URLSearchParams({
  search_terms: 'nutella',
  json: '1',
  page_size: '10',
  fields: 'product_name_fr,product_name,nutriments,code',
  lc: 'fr',
});

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 20000);

const res = await fetch('https://world.openfoodfacts.org/cgi/search.pl?' + params, {
  signal: controller.signal,
});
clearTimeout(timeout);

const data = await res.json();
console.log(`OFF results for "nutella" (${(data.products || []).length} raw):\n`);

let shown = 0;
for (const p of data.products || []) {
  const name = p.product_name_fr || p.product_name;
  const kcal = p.nutriments?.['energy-kcal_100g'];
  if (!name || kcal == null) {
    console.log(`  [FILTERED] ${name || '(no name)'} — missing kcal`);
    continue;
  }
  shown++;
  const prot = Math.round((p.nutriments?.proteins_100g ?? 0) * 10) / 10;
  const carbs = Math.round((p.nutriments?.carbohydrates_100g ?? 0) * 10) / 10;
  const fat = Math.round((p.nutriments?.fat_100g ?? 0) * 10) / 10;
  console.log(`  ${shown}. ${name} — ${Math.round(kcal)} kcal · ${prot}g P · ${carbs}g G · ${fat}g L`);
}
console.log(`\nValid results: ${shown}`);
