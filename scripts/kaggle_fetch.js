/**
 * kaggle_fetch.js
 * Downloads real Uganda/Africa health datasets from Kaggle into data/kaggle/
 * Uses the py launcher (py -3) to invoke the kaggle CLI.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pyCmd = 'py -3';

// Ensure pip and kaggle are up-to-date (fast if already installed)
execSync(`${pyCmd} -m pip install --upgrade pip kaggle`, { stdio: 'inherit' });

// Ensure output directory exists
const outDir = path.join(__dirname, '..', 'data', 'kaggle');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Real Kaggle dataset slugs relevant to Uganda/East Africa health and STDs/HIV
const slugs = [
  'waalbannyantudre/african-cigarette-prices',          // Africa health/tobacco
  'sinakaraji/covid-vaccination-vs-death',              // COVID vaccination vs mortality
  'ognevdenis/covid-19-datasets',                       // COVID-19 datasets
  'lucafrance/the-world-factbook-by-cia',               // Global health indicators
  'whenamancodes/world-population-live-dataset',        // Demographics
  'techsalerator/new-events-data-in-uganda',            // Uganda events data
  'techsalerator/satellite-imagery-data-for-uganda',    // Uganda satellite imagery
  'tahmidmir/stds-in-california',                       // California STD Statistics (2001-2021)
  'kanchana1990/sti-diagnosis-numbers-of-england-2013-2022', // STI Diagnosis Numbers of England
  'willianoliveiragibin/hiv-themselves',                // HIV themselves
  'shuvokumarbasak2030/hpv-vaccination-and-cervical-cancer', // HPV vaccination and cervical cancer
];

let passed = 0;
let failed = 0;

for (const slug of slugs) {
  const name = slug.replace('/', '__');
  const dest = path.join(outDir, name);
  
  // Skip if already downloaded (contains files)
  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    console.log(`\n⏭️  Skipping (already downloaded): ${slug}`);
    passed++;
    continue;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  console.log(`\n⬇️  Downloading: ${slug}`);
  try {
    execSync(`${pyCmd} -m kaggle datasets download -d ${slug} -p "${dest}" --unzip`, {
      stdio: 'inherit',
    });
    console.log(`✅  Done: ${slug}`);
    passed++;
  } catch (e) {
    console.error(`❌  Failed: ${slug} — ${e.message.split('\n')[0]}`);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`Download complete: ${passed} succeeded, ${failed} failed`);
console.log(`Output directory: ${outDir}`);
