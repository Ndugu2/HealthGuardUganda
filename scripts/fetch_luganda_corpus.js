// scripts/fetch_luganda_corpus.js
/**
 * Fetch the Luganda‑English parallel corpus from Hugging Face.
 * Clones the repository (shallow) into data/translation and extracts the CSV.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const targetDir = path.resolve(__dirname, '../data/translation');
const repoUrl = 'https://github.com/kambale/luganda-english-parallel-corpus.git';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (!fs.existsSync(path.join(targetDir, '.git'))) {
  console.log('Cloning Luganda‑English corpus...');
  execSync(`git clone --depth 1 ${repoUrl} "${targetDir}"`, { stdio: 'inherit' });
}

const srcCsv = path.join(targetDir, 'parallel_corpus.csv');
const dstCsv = path.join(targetDir, 'kambale_luganda_english.csv');
if (fs.existsSync(srcCsv)) {
  fs.copyFileSync(srcCsv, dstCsv);
  console.log('Corpus ready at', dstCsv);
} else {
  console.error('Source CSV not found:', srcCsv);
}
