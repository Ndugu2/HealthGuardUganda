/**
 * patch_responsive.js
 * Batch-patches all screens to import useResponsive and use it instead of
 * manual useWindowDimensions + hardcoded breakpoints.
 *
 * Run: node scripts/patch_responsive.js
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'src', 'screens');

// Files to patch
const files = fs.readdirSync(SCREENS_DIR).filter(f => f.endsWith('.tsx'));

let patched = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(SCREENS_DIR, file);
  let src = fs.readFileSync(filePath, 'utf8');

  // Skip if already using useResponsive
  if (src.includes("from '../responsive'")) {
    console.log(`  ⏭  Skipping (already patched): ${file}`);
    skipped++;
    continue;
  }

  // Skip if it doesn't use useWindowDimensions
  if (!src.includes('useWindowDimensions')) {
    console.log(`  ⏭  Skipping (no dimensions): ${file}`);
    skipped++;
    continue;
  }

  let modified = src;

  // 1. Add import after theme import or after last import line
  const themeImportMatch = modified.match(/import \{[^}]*\} from '\.\.\/theme';/);
  if (themeImportMatch) {
    const themeImport = themeImportMatch[0];
    if (!modified.includes("from '../responsive'")) {
      modified = modified.replace(
        themeImport,
        `${themeImport}\nimport { useResponsive, typography } from '../responsive';`
      );
    }
  } else {
    // Fallback: insert after last import statement
    const lastImportIdx = modified.lastIndexOf('\nimport ');
    const endOfLastImport = modified.indexOf('\n', lastImportIdx + 1);
    if (endOfLastImport !== -1) {
      modified =
        modified.slice(0, endOfLastImport + 1) +
        `import { useResponsive, typography } from '../responsive';\n` +
        modified.slice(endOfLastImport + 1);
    }
  }

  // 2. Replace manual breakpoint declarations inside component functions
  // Pattern: const { width } = useWindowDimensions();\n  const isDesktop = width > NNN;
  modified = modified.replace(
    /const \{ width(?:, height)? \} = useWindowDimensions\(\);\r?\n(\s*)const isDesktop = width > (\d+);(\r?\n\s*const isMobile = width < \d+;)?(\r?\n\s*const isSmall = width < \d+ \|\| height < \d+;)?(\r?\n\s*const isPhone = width < \d+;)?/g,
    `const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();`
  );

  // 3. Simpler pattern without isDesktop
  modified = modified.replace(
    /const \{ width(?:, height)? \} = useWindowDimensions\(\);\r?\n(\s*)const isDesktop = width > (\d+);/g,
    `const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();`
  );

  // 4. Lone useWindowDimensions calls (no breakpoints derived from them directly)
  // Only if the above patterns didn't catch it
  modified = modified.replace(
    /const \{ width(?:, height)? \} = useWindowDimensions\(\);/g,
    `const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();`
  );

  if (modified !== src) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`  ✅ Patched: ${file}`);
    patched++;
  } else {
    console.log(`  ⚠️  No changes made: ${file}`);
    skipped++;
  }
}

console.log(`\nDone. Patched: ${patched}, Skipped: ${skipped}`);
