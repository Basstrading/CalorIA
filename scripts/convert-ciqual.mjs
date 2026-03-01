#!/usr/bin/env node
/**
 * Convert Ciqual XML data to compact JSON for the app.
 * Usage: node scripts/convert-ciqual.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

import { join } from 'path';
import { homedir } from 'os';

const TMP_DIR = join(homedir(), 'AppData', 'Local', 'Temp', 'ciqual_data');
const ALIM_FILE = join(TMP_DIR, 'alim_2020_07_07.xml');
const COMPO_FILE = join(TMP_DIR, 'compo_2020_07_07.xml');

// Constituent codes we care about
const KCAL_CODE = '328';      // Energy EU regulation (kcal/100g)
const KCAL_CODE_ALT = '333';  // Energy N x Jones factor (kcal/100g) - fallback
const PROTEIN_CODE = '25000';
const CARBS_CODE = '31000';
const FATS_CODE = '40000';

const WANTED_CODES = [KCAL_CODE, KCAL_CODE_ALT, PROTEIN_CODE, CARBS_CODE, FATS_CODE];

// --- Parse food items ---
const alimXml = readFileSync(ALIM_FILE, 'latin1');
const foods = new Map();

const alimRegex = /<ALIM>\s*<alim_code>\s*(\d+)\s*<\/alim_code>\s*<alim_nom_fr>\s*(.*?)\s*<\/alim_nom_fr>/g;
let match;
while ((match = alimRegex.exec(alimXml)) !== null) {
  const code = match[1].trim();
  const name = match[2].trim();
  foods.set(code, { alim_nom_fr: name, energie_kcal: 0, proteines: 0, glucides: 0, lipides: 0 });
}

console.log(`Parsed ${foods.size} food items`);

// --- Parse compositions ---
const compoXml = readFileSync(COMPO_FILE, 'latin1');

const compoRegex = /<COMPO>\s*<alim_code>\s*(\d+)\s*<\/alim_code>\s*<const_code>\s*(\d+)\s*<\/const_code>\s*<teneur>\s*(.*?)\s*<\/teneur>/g;
let compoCount = 0;
while ((match = compoRegex.exec(compoXml)) !== null) {
  const alimCode = match[1].trim();
  const constCode = match[2].trim();
  const rawValue = match[3].trim();

  if (!WANTED_CODES.includes(constCode)) continue;

  const food = foods.get(alimCode);
  if (!food) continue;

  // Parse value: handle French decimal comma, dashes, traces, etc.
  let value = 0;
  if (rawValue !== '-' && rawValue !== 'traces' && rawValue !== '') {
    const parsed = parseFloat(rawValue.replace(',', '.').replace('<', ''));
    if (!isNaN(parsed)) value = parsed;
  }

  switch (constCode) {
    case KCAL_CODE: food.energie_kcal = value; break;
    case KCAL_CODE_ALT:
      // Only use Jones factor if EU regulation value is missing
      if (food.energie_kcal === 0) food.energie_kcal = value;
      break;
    case PROTEIN_CODE: food.proteines = value; break;
    case CARBS_CODE: food.glucides = value; break;
    case FATS_CODE: food.lipides = value; break;
  }
  compoCount++;
}

console.log(`Parsed ${compoCount} composition entries`);

// --- Build result, estimate missing kcal from macros (4-4-9 formula) ---
const result = [];
let estimated = 0;
for (const food of foods.values()) {
  if (!food.alim_nom_fr) continue;

  let kcal = food.energie_kcal;
  if (kcal === 0 && (food.proteines > 0 || food.glucides > 0 || food.lipides > 0)) {
    kcal = food.proteines * 4 + food.glucides * 4 + food.lipides * 9;
    estimated++;
  }

  result.push({
    alim_nom_fr: food.alim_nom_fr,
    energie_kcal: Math.round(kcal * 10) / 10,
    proteines: Math.round(food.proteines * 10) / 10,
    glucides: Math.round(food.glucides * 10) / 10,
    lipides: Math.round(food.lipides * 10) / 10,
  });
}
console.log(`Estimated kcal from macros for ${estimated} items`);

// Sort alphabetically
result.sort((a, b) => a.alim_nom_fr.localeCompare(b.alim_nom_fr, 'fr'));

const json = JSON.stringify(result);
const outputPath = 'src/data/ciqual.json';
writeFileSync(outputPath, json, 'utf-8');

console.log(`Wrote ${result.length} entries to ${outputPath}`);
console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
