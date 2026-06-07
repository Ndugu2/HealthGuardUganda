const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'en.json');
const lgPath = path.join(__dirname, '..', 'src', 'i18n', 'lg.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const lg = JSON.parse(fs.readFileSync(lgPath, 'utf8'));

function flatten(obj, prefix = '') {
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(res, flatten(v, newKey));
    } else {
      res[newKey] = v;
    }
  }
  return res;
}

const flatEn = flatten(en);
const flatLg = flatten(lg);

let missing = [];
let untranslated = [];
for (const key of Object.keys(flatEn)) {
  if (!(key in flatLg)) {
    missing.push(key);
  } else if (flatEn[key] === flatLg[key]) {
    untranslated.push(key);
  }
}

if (missing.length === 0 && untranslated.length === 0) {
  console.log('All translations are present and differ from English.');
} else {
  if (missing.length) {
    console.log('Missing keys in Luganda:');
    missing.forEach(k => console.log('  ' + k));
  }
  if (untranslated.length) {
    console.log('Untranslated (same as English) keys:');
    untranslated.forEach(k => console.log('  ' + k));
  }
}
