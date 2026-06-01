#!/usr/bin/env node
/**
 * Reads the current csvSeeds.ts, replaces the DISEASES_CSV constant
 * with the updated content from uganda_diseases.csv, and writes back.
 */
const fs = require('fs');
const path = require('path');

const seedsPath = path.join(__dirname, '..', 'src', 'db', 'csvSeeds.ts');
const csvPath = path.join(__dirname, '..', 'src', 'db', 'uganda_diseases.csv');

const seedsContent = fs.readFileSync(seedsPath, 'utf-8');
const csvContent = fs.readFileSync(csvPath, 'utf-8').trimEnd();

// Find the DISEASES_CSV export and replace everything between its backticks
const marker = 'export const DISEASES_CSV = `';
const startIdx = seedsContent.indexOf(marker);
if (startIdx === -1) {
  console.error('Could not find DISEASES_CSV marker in csvSeeds.ts');
  process.exit(1);
}

const contentStart = startIdx + marker.length;
// Find the closing backtick+semicolon
const endIdx = seedsContent.indexOf('`;', contentStart);
if (endIdx === -1) {
  console.error('Could not find closing `; for DISEASES_CSV');
  process.exit(1);
}

// Escape any backticks or ${} in the CSV content for template literals
const escapedCsv = csvContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const newContent = seedsContent.slice(0, contentStart) + escapedCsv + seedsContent.slice(endIdx);

fs.writeFileSync(seedsPath, newContent, 'utf-8');
console.log('✅ csvSeeds.ts DISEASES_CSV updated successfully');
console.log(`   Old content: ${endIdx - contentStart} chars`);
console.log(`   New content: ${escapedCsv.length} chars`);
