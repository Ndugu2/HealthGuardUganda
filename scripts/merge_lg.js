// scripts/merge_lg.js
/**
 * Merge Luganda translations from a CSV (English, Luganda) into src/i18n/lg.json.
 * It replaces any value in lg.json that is still identical to the English string.
 */
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const enPath = path.resolve(__dirname, '../src/i18n/en.json');
const lgPath = path.resolve(__dirname, '../src/i18n/lg.json');
const csvPath = path.resolve(__dirname, '../data/translation/kambale_luganda_english.csv');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let lg = JSON.parse(fs.readFileSync(lgPath, 'utf8'));
const csvData = fs.readFileSync(csvPath, 'utf8');
const records = parse(csvData, { columns: ['en', 'lg'], skip_empty_lines: true });
const map = new Map();
records.forEach(r => map.set(r.en.trim(), r.lg.trim()));

let replaced = 0;
function walk(eObj, lObj) {
  for (const key of Object.keys(eObj)) {
    const eVal = eObj[key];
    const lVal = lObj[key];
    if (eVal && typeof eVal === 'object' && !Array.isArray(eVal)) {
      if (!lObj[key]) lObj[key] = {};
      walk(eVal, lObj[key]);
    } else {
      if (lVal === eVal && map.has(eVal)) {
        lObj[key] = map.get(eVal);
        replaced++;
      }
    }
  }
}
walk(en, lg);
if (replaced > 0) {
  fs.writeFileSync(lgPath, JSON.stringify(lg, null, 2), 'utf8');
  console.log(`Replaced ${replaced} translations in lg.json`);
} else {
  console.log('No matching translations to replace.');
}
