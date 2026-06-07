const fs = require('fs');
const path = require('path');
const enPath = path.resolve('src', 'i18n', 'en.json');
const lgPath = path.resolve('src', 'i18n', 'lg.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const lg = JSON.parse(fs.readFileSync(lgPath, 'utf8'));
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    const val = obj[k];
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      keys = keys.concat(getAllKeys(val, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}
function getValueByPath(obj, path) {
  return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj);
}
const enKeys = getAllKeys(en);
const lgKeys = getAllKeys(lg);
const missingInLg = enKeys.filter(k => !lgKeys.includes(k));
const untranslated = enKeys.filter(k => {
  const enVal = getValueByPath(en, k);
  const lgVal = getValueByPath(lg, k);
  return lgVal && lgVal === enVal;
});
console.log('=== Missing keys in Luganda ===');
missingInLg.forEach(k => console.log(k));
console.log('\n=== Keys with identical English text (likely untranslated) ===');
untranslated.forEach(k => console.log(k));
