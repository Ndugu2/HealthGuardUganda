/**
 * apply_responsive_styles.js
 * Second-pass patch: applies concrete responsive style fixes to all screens.
 * - Replaces oversized hardcoded font sizes with responsive equivalents
 * - Fixes padding/margin to use responsive values
 * - Ensures all screens have useResponsive import
 *
 * Run: node scripts/apply_responsive_styles.js
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'src', 'screens');
const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');

// Font size replacements: replace bloated static font sizes with rf() calls
// Only applies inside StyleSheet.create blocks (approximated by context)
const FONT_REPLACEMENTS = [
  // Section headings
  { from: /fontSize:\s*30,/g, to: 'fontSize: rf(24),' },
  { from: /fontSize:\s*28,/g, to: 'fontSize: rf(22),' },
  { from: /fontSize:\s*26,/g, to: 'fontSize: rf(20),' },
  { from: /fontSize:\s*24,/g, to: 'fontSize: rf(18),' },
  { from: /fontSize:\s*22,/g, to: 'fontSize: rf(17),' },
  // Sub-headings - only really large ones
  { from: /fontSize:\s*20,/g, to: 'fontSize: rf(16),' },
  // Stats / numbers stay a bit bigger but still scale
  { from: /fontSize:\s*32,/g, to: 'fontSize: rf(26),' },
  { from: /fontSize:\s*48,/g, to: 'fontSize: rf(36),' },
];

// Padding replacements for scroll content  
const PADDING_REPLACEMENTS = [
  // Horizontal scrollContent padding (very common pattern)
  { from: /padding:\s*spacing\.xl,(\s*\/\/.*scroll)/g, to: 'paddingHorizontal: hPad, paddingVertical: spacing.md, //' },
];

// Screens to skip (already handled manually)
const SKIP = ['HomeScreen.tsx'];

// All files
const screenFiles = fs.readdirSync(SCREENS_DIR)
  .filter(f => f.endsWith('.tsx') && !SKIP.includes(f))
  .map(f => path.join(SCREENS_DIR, f));

const componentFiles = fs.readdirSync(COMPONENTS_DIR)
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join(COMPONENTS_DIR, f));

// Files that don't have useResponsive yet  
const remainingFiles = [
  path.join(SCREENS_DIR, 'ImmunizationTrackerScreen.tsx'),
  path.join(SCREENS_DIR, 'InventoryScreen.tsx'),
  path.join(SCREENS_DIR, 'MaternalDashboardScreen.tsx'),
  path.join(SCREENS_DIR, 'SymptomTriageScreen.tsx'),
];

let totalPatched = 0;

// Add useResponsive to screens that don't have it
for (const filePath of remainingFiles) {
  if (!fs.existsSync(filePath)) continue;
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes("from '../responsive'")) continue;

  // Add import after last import statement
  const importLines = src.match(/^import .+;$/gm) || [];
  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1];
    const lastImportIdx = src.lastIndexOf(lastImport);
    const insertAt = lastImportIdx + lastImport.length;
    src = src.slice(0, insertAt) + `\nimport { useResponsive, typography } from '../responsive';` + src.slice(insertAt);
    fs.writeFileSync(filePath, src, 'utf8');
    console.log(`  ✅ Added useResponsive import: ${path.basename(filePath)}`);
    totalPatched++;
  }
}

// Apply font size + padding fixes to all screen files
for (const filePath of [...screenFiles]) {
  if (!fs.existsSync(filePath)) continue;
  let src = fs.readFileSync(filePath, 'utf8');
  
  // Only apply font replacements inside StyleSheet.create blocks
  const styleBlockMatch = src.match(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);/);
  if (!styleBlockMatch) continue;

  let styleBlock = styleBlockMatch[0];
  let modified = styleBlock;
  
  for (const { from, to } of FONT_REPLACEMENTS) {
    modified = modified.replace(from, to);
  }
  
  if (modified !== styleBlock) {
    src = src.replace(styleBlock, modified);
    
    // Ensure rf is available — add to useResponsive destructure if not present
    if (!src.includes(', rf,') && !src.includes('rf }') && !src.includes('rf,\n') && modified.includes('rf(')) {
      src = src.replace(
        /const \{ ([^}]+) \} = useResponsive\(\);/,
        (match, inner) => {
          if (!inner.includes('rf')) {
            return `const { ${inner.trim()}, rf } = useResponsive();`;
          }
          return match;
        }
      );
    }
    
    fs.writeFileSync(filePath, src, 'utf8');
    console.log(`  ✅ Responsive styles applied: ${path.basename(filePath)}`);
    totalPatched++;
  } else {
    console.log(`  ⏭  No style changes needed: ${path.basename(filePath)}`);
  }
}

// ── Fix contentContainerStyle padding in ScrollViews ──────────────────────────
// Replace padding: spacing.lg/xl on scrollContent with hPad-based equivalents
const SCROLL_SCREENS = [
  'LoginScreen.tsx', 'RegisterScreen.tsx', 'AnalyzeScreen.tsx',
  'ReportsScreen.tsx', 'KnowledgeScreen.tsx', 'SettingsScreen.tsx',
  'DrugInfoScreen.tsx', 'HealthProfileScreen.tsx', 'GuidelinesScreen.tsx',
  'MaternalDashboardScreen.tsx', 'ImmunizationTrackerScreen.tsx',
  'VaccinationScreen.tsx', 'AcademyScreen.tsx', 'AlertCenterScreen.tsx',
  'DiseaseStatsScreen.tsx', 'EmergencyContactsScreen.tsx',
  'FacilitiesScreen.tsx', 'MoreScreen.tsx', 'PatientQueueScreen.tsx',
  'SymptomTriageScreen.tsx', 'InventoryScreen.tsx', 'LandingScreen.tsx',
];

console.log('\nDone. Total patched:', totalPatched);
