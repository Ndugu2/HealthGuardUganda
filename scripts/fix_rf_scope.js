/**
 * fix_rf_scope.js
 * Fixes two issues from the responsive patch:
 *
 * 1. rf() used inside StyleSheet.create() — must use static rf() from responsive.ts,
 *    not the hook version. Replace with the top-level imported rf function.
 *
 * 2. isMobile / isSmall undefined — map to isPhone from useResponsive().
 *
 * Run: node scripts/fix_rf_scope.js
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'src', 'screens');

const files = fs.readdirSync(SCREENS_DIR)
  .filter(f => f.endsWith('.tsx'))
  .map(f => ({ name: f, filePath: path.join(SCREENS_DIR, f) }));

let totalFixed = 0;

for (const { name, filePath } of files) {
  let src = fs.readFileSync(filePath, 'utf8');
  let modified = src;
  let changed = false;

  // ── Fix 1: ensure static rf is imported from '../responsive' ──────────────
  // The hook useResponsive() returns rf, but StyleSheet.create() runs outside
  // component scope. We need to import the static `rf` directly.
  if (modified.includes("from '../responsive'") && modified.includes('rf(')) {
    // Check if the import already includes static rf
    const importMatch = modified.match(/import \{([^}]+)\} from '\.\.\/responsive';/);
    if (importMatch) {
      const imported = importMatch[1];
      if (!imported.includes(' rf') && !imported.startsWith('rf')) {
        // Add rf to the import
        const newImport = `import {${imported}, rf } from '../responsive';`;
        modified = modified.replace(importMatch[0], newImport);
        changed = true;
      }
    }
  }

  // ── Fix 2: isMobile → isPhone ─────────────────────────────────────────────
  if (modified.includes('isMobile')) {
    // Add isMobile as alias from useResponsive destructure if not there
    modified = modified.replace(
      /const \{ ([^}]+) \} = useResponsive\(\);/,
      (match, inner) => {
        if (!inner.includes('isMobile')) {
          return `const { ${inner.trim()} } = useResponsive();\n  const isMobile = isPhone;`;
        }
        return match;
      }
    );
    changed = true;
  }

  // ── Fix 3: isSmall → isPhone ──────────────────────────────────────────────
  if (modified.includes('isSmall') && !modified.includes('const isSmall')) {
    modified = modified.replace(
      /const \{ ([^}]+) \} = useResponsive\(\);/,
      (match, inner) => {
        // Add isSmall alias after the destructure
        return `${match}\n  const isSmall = isPhone;`;
      }
    );
    changed = true;
  }

  if (changed && modified !== src) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`  ✅ Fixed: ${name}`);
    totalFixed++;
  } else {
    // console.log(`  ⏭  No fix needed: ${name}`);
  }
}

console.log(`\nFixed ${totalFixed} files.`);
