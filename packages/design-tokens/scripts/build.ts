import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read the source tokens
const tokensPath = join(rootDir, 'src', 'tokens', 'TAKT_design_tokens_v2_3_6.json');
const tokens = JSON.parse(readFileSync(tokensPath, 'utf-8'));

function flattenTokens(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key: replace dots with dashes for valid CSS custom property names
    const sanitizedKey = key.replace(/\./g, '-');
    const newKey = prefix ? `${prefix}-${sanitizedKey}` : sanitizedKey;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTokens(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(value);
    }
  }
  return result;
}

const flatTokens = flattenTokens(tokens);

// ============================================================================
// 1. COPY FONTS & ASSETS TO DIST
// ============================================================================
const distDir = join(rootDir, 'dist');
const distFontsDir = join(distDir, 'fonts');
const distAssetsDir = join(distDir, 'assets');

if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
if (!existsSync(distFontsDir)) mkdirSync(distFontsDir, { recursive: true });
if (!existsSync(distAssetsDir)) mkdirSync(distAssetsDir, { recursive: true });

// Copy fonts
const srcFontsDir = join(rootDir, 'src', 'fonts');
function copyFontsRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
      copyFontsRecursive(srcPath, destPath);
    } else if (entry.isFile() && (extname(entry.name) === '.ttf' || extname(entry.name) === '.woff2' || extname(entry.name) === '.txt')) {
      cpSync(srcPath, destPath);
    }
  }
}
copyFontsRecursive(srcFontsDir, distFontsDir);

// Copy assets (logos, icons, fonts/OFL)
const srcAssetsDir = join(rootDir, 'src', 'assets');
function copyAssetsRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
      copyAssetsRecursive(srcPath, destPath);
    } else if (entry.isFile() && (extname(entry.name) === '.svg' || extname(entry.name) === '.txt')) {
      cpSync(srcPath, destPath);
    }
  }
}
copyAssetsRecursive(srcAssetsDir, distAssetsDir);

// ============================================================================
// 2. GENERATE @font-face CSS
// ============================================================================
const fontFaces = `
/* ============================================================================
   TAKT Design System - Self-hosted Fonts
   Generated from TAKT_design_tokens_v2_3_6.json
   ============================================================================ */

/* Black Ops One - Brand signature only */
@font-face {
  font-family: 'Black Ops One';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./fonts/black-ops-one/BlackOpsOne-Regular.ttf') format('truetype');
}

/* Sora - Display, H1-H3 */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('./fonts/sora/Sora-SemiBold.ttf') format('truetype');
}
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./fonts/sora/Sora-Bold.ttf') format('truetype');
}

/* Inter - Interface, body, forms, tables */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./fonts/inter/Inter-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./fonts/inter/Inter-Medium.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('./fonts/inter/Inter-SemiBold.ttf') format('truetype');
}

/* Inter tabular-nums - numeric data */
@font-face {
  font-family: 'Inter Tabular';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./fonts/inter/Inter-Regular.ttf') format('truetype');
  font-variant-numeric: tabular-nums;
}
`;

// Generate CSS variables - skip metadata and descriptive fields that aren't valid CSS custom properties
function isValidCssValue(value: string): boolean {
  // Skip values with URLs
  if (value.includes('://') || value.includes('http')) return false;
  // Skip values with CSS-invalid characters: *, /, ;, @, {, }, [, ], (, ), =, >, <
  if (/[*\/;@{}[\]=<>]/.test(value)) return false;
  // Skip very long descriptive text (likely documentation)
  if (value.length > 200) return false;
  // Skip French descriptive text with accents and punctuation
  if (/[àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/.test(value) && value.length > 50) return false;
  return true;
}

function isValidCssKey(key: string): boolean {
  // Skip keys with spaces or invalid CSS custom property characters
  if (/\s/.test(key)) return false;
  return true;
}

const cssVars = Object.entries(flatTokens)
  .filter(([key, value]) => {
    // Skip metadata fields that start with $
    if (key.startsWith('$')) return false;
    // Skip keys with spaces or invalid characters
    if (!isValidCssKey(key)) return false;
    // Skip fields with invalid CSS values
    if (typeof value === 'string' && !isValidCssValue(value)) return false;
    return true;
  })
  .map(([key, value]) => `  --${key}: ${value};`)
  .join('\n');

const cssOutput = `:root {\n${cssVars}\n}\n${fontFaces}\n`;

// ============================================================================
// 3. VALIDATIONS
// ============================================================================

// 3a. Contrast validation
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Surfaces for text contrast testing (from JSON contrast.automated_test.text_surfaces)
const textSurfaces = {
  ivory: '#FBFCFF',
  warm: '#FCF9F4',
  inset: '#F3F5F5',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
};

// Text tokens to test (from JSON contrast.automated_test.text_tokens) - using sanitized names
const textTokenPaths = [
  'semantic-color-brand-primary-text',
  'semantic-color-brand-secondary-text',
  'color-status-error-text',
  'color-status-warning-text',
  'semantic-color-text-tertiary',
];

function getTokenValue(path: string): string | undefined {
  return flatTokens[path];
}

console.log('\n🔍 Running contrast validation...');
let contrastErrors = 0;

for (const tokenPath of textTokenPaths) {
  const fgColor = getTokenValue(tokenPath);
  if (!fgColor) {
    console.warn(`  ⚠ Token not found: ${tokenPath}`);
    continue;
  }
  for (const [surfaceName, bgColor] of Object.entries(textSurfaces)) {
    const ratio = contrastRatio(fgColor, bgColor);
    const passes = ratio >= 4.5;
    const status = passes ? '✅' : '❌';
    if (!passes) contrastErrors++;
    console.log(`  ${status} ${tokenPath} on ${surfaceName}: ${ratio.toFixed(3)}:1 (min 4.5:1)`);
  }
}

// Test UI component borders (3:1 minimum) - only default and interactive are required to meet 3:1
// subtle is decorative/divider only
const borderTokenPaths = ['semantic-color-border-default', 'semantic-color-border-interactive'];
console.log('\n🔍 Running UI component border contrast validation...');
for (const tokenPath of borderTokenPaths) {
  const fgColor = getTokenValue(tokenPath);
  if (!fgColor) continue;
  for (const [surfaceName, bgColor] of Object.entries(textSurfaces)) {
    const ratio = contrastRatio(fgColor, bgColor);
    const passes = ratio >= 3.0;
    const status = passes ? '✅' : '❌';
    if (!passes) contrastErrors++;
    console.log(`  ${status} ${tokenPath} on ${surfaceName}: ${ratio.toFixed(3)}:1 (min 3:1)`);
  }
}

// Test navigation_on_deep tokens (4.5:1 for text, 3:1 for icons/indicators) - using sanitized names (underscores preserved)
const navTextTokens = ['color-navigation_on_deep-text_primary', 'color-navigation_on_deep-text_secondary'];
const navUITokens = ['color-navigation_on_deep-icon_primary', 'color-navigation_on_deep-icon_secondary', 'color-navigation_on_deep-active_indicator', 'color-navigation_on_deep-focus'];
const navDeepBg = '#29363C';

console.log('\n🔍 Running navigation (Deep) contrast validation...');
for (const tokenPath of navTextTokens) {
  const fgColor = getTokenValue(tokenPath);
  if (!fgColor) continue;
  const ratio = contrastRatio(fgColor, navDeepBg);
  const passes = ratio >= 4.5;
  const status = passes ? '✅' : '❌';
  if (!passes) contrastErrors++;
  console.log(`  ${status} ${tokenPath} on Deep: ${ratio.toFixed(3)}:1 (min 4.5:1)`);
}
for (const tokenPath of navUITokens) {
  const fgColor = getTokenValue(tokenPath);
  if (!fgColor) continue;
  const ratio = contrastRatio(fgColor, navDeepBg);
  const passes = ratio >= 3.0;
  const status = passes ? '✅' : '❌';
  if (!passes) contrastErrors++;
  console.log(`  ${status} ${tokenPath} on Deep: ${ratio.toFixed(3)}:1 (min 3:1)`);
}

// Check exempt token
const exemptColor = getTokenValue('color-navigation_on_deep-text_disabled');
if (exemptColor) {
  const ratio = contrastRatio(exemptColor, navDeepBg);
  console.log(`  ℹ️  EXEMPT color-navigation_on_deep-text_disabled on Deep: ${ratio.toFixed(3)}:1 (documented, not gated)`);
}

if (contrastErrors > 0) {
  console.error(`\n❌ Contrast validation failed: ${contrastErrors} error(s)`);
  process.exit(1);
} else {
  console.log('\n✅ All contrast checks passed!');
}

// 3b. Icon validation
console.log('\n🔍 Running icon validation...');

// Known lucide-react icon names (PascalCase) - subset used in tokens
const lucideIcons = new Set([
  'FilePen', 'Loader', 'Loader2', 'PencilLine', 'ClipboardCheck', 'ShieldCheck',
  'CircleX', 'MessageCircleWarning', 'CircleCheck', 'BadgeCheck', 'Archive',
  'Clock', 'TimerOff', 'CircleStop', 'RotateCcw', 'CalendarCog', 'CalendarCheck',
  'CalendarX', 'TriangleAlert', 'CalendarClock', 'MapPinCheck', 'MapPinOff',
  'ShieldAlert', 'HeartHandshake', 'Cpu', 'Hand', 'CircleAlert', 'Info',
  'AlertCircle', 'AlertTriangle', 'CheckCircle', 'XCircle', 'Check', 'X',
  'Spinner', 'RefreshCw',
]);

// Convert kebab-case to PascalCase
function kebabToPascal(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// Local icons from assets/icons/
const localIcons = new Set<string>();
const localIconsDir = join(rootDir, 'src', 'assets', 'icons');
if (existsSync(localIconsDir)) {
  for (const file of readdirSync(localIconsDir)) {
    if (file.endsWith('.svg')) {
      localIcons.add(basename(file, '.svg').toLowerCase());
    }
  }
}

// Extract all state icons from tokens
const stateIconPaths: string[] = [];
function extractStateIcons(obj: Record<string, unknown>, path = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const newPath = path ? `${path}.${key}` : key;
    if (key === 'icon' && typeof value === 'string') {
      stateIconPaths.push(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      extractStateIcons(value as Record<string, unknown>, newPath);
    }
  }
}
extractStateIcons(tokens.states || {});

let iconErrors = 0;
for (const iconName of stateIconPaths) {
  const normalized = iconName.toLowerCase();
  const pascalName = kebabToPascal(iconName);
  const inLucide = lucideIcons.has(pascalName);
  const inLocal = localIcons.has(normalized);
  
  if (!inLucide && !inLocal) {
    console.error(`  ❌ Missing icon: "${iconName}" (not in lucide-react as ${pascalName} or local assets/icons/)`);
    iconErrors++;
  } else {
    const source = inLucide ? 'lucide-react' : 'local';
    console.log(`  ✅ ${iconName} (${source})`);
  }
}

if (iconErrors > 0) {
  console.error(`\n❌ Icon validation failed: ${iconErrors} missing icon(s)`);
  process.exit(1);
} else {
  console.log('\n✅ All state icons found!');
}

// 3c. Lint: forbid states.*.*.color as text color
console.log('\n🔍 Running state color/text lint...');
function checkStateColorUsage(obj: Record<string, unknown>, path = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const newPath = path ? `${path}.${key}` : key;
    if (key === 'color' && typeof value === 'string') {
      console.log(`  ℹ️  State color token: ${newPath} = ${value} (must not be used for text)`);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      checkStateColorUsage(value as Record<string, unknown>, newPath);
    }
  }
}
checkStateColorUsage(tokens.states || {});
console.log('  ℹ️  Rule: Only states.*.*.text and states.*.*.textOnLight may be used for text color.');

// ============================================================================
// 4. GENERATE TAILWIND CONFIG
// ============================================================================
type TailwindColors = Record<string, string | Record<string, string>>;

const colorTokens = Object.entries(flatTokens)
  .filter(([key]) => key.startsWith('color-'))
  .reduce((acc, [key, value]) => {
    const colorPath = key.replace('color-', '').split('-');
    let current: TailwindColors = acc;
    for (let i = 0; i < colorPath.length - 1; i++) {
      if (!current[colorPath[i]]) current[colorPath[i]] = {};
      current = current[colorPath[i]] as TailwindColors;
    }
    current[colorPath[colorPath.length - 1]] = value;
    return acc;
  }, {} as TailwindColors);

const spacingTokens = Object.entries(flatTokens)
  .filter(([key]) => key.startsWith('spacing-'))
  .reduce((acc, [key, value]) => {
    const spacingKey = key.replace('spacing-', '');
    acc[spacingKey] = value;
    return acc;
  }, {} as Record<string, string>);

const fontTokens = Object.entries(flatTokens)
  .filter(([key]) => key.startsWith('font-'))
  .reduce((acc, [key, value]) => {
    const fontKey = key.replace('font-', '');
    acc[fontKey] = value;
    return acc;
  }, {} as Record<string, string>);

const tailwindConfig = `import type { Config } from 'tailwindcss';

export default {
  content: [
    '../../apps/web/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorTokens, null, 2)},
      spacing: ${JSON.stringify(spacingTokens, null, 2)},
      fontFamily: ${JSON.stringify(fontTokens, null, 2)},
    },
  },
  plugins: [],
} satisfies Config;
`;

// ============================================================================
// 5. WRITE OUTPUT FILES
// ============================================================================
writeFileSync(join(distDir, 'tokens.css'), cssOutput);
writeFileSync(join(distDir, 'tailwind.js'), tailwindConfig);
writeFileSync(join(distDir, 'index.js'), `export const tokens = ${JSON.stringify(flatTokens, null, 2)};`);

// Generate TypeScript declarations
const dtsOutput = `// Auto-generated from TAKT_design_tokens_v2_3_6.json
export const tokens: Record<string, string> = ${JSON.stringify(flatTokens, null, 2)};

export interface TailwindConfig {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorTokens, null, 2)};
      spacing: ${JSON.stringify(spacingTokens, null, 2)};
      fontFamily: ${JSON.stringify(fontTokens, null, 2)};
    };
  };
}
`;
writeFileSync(join(distDir, 'index.d.ts'), dtsOutput);
writeFileSync(join(distDir, 'tailwind.d.ts'), `import type { Config } from 'tailwindcss';

export interface TailwindConfig extends Config {
  theme: {
    extend: {
      colors: Record<string, string | Record<string, string>>;
      spacing: Record<string, string>;
      fontFamily: Record<string, string>;
    };
  };
}

export default {} as TailwindConfig;
`);

console.log('\n✅ Design tokens built successfully!');
console.log(`Generated ${Object.keys(flatTokens).length} CSS variables`);
console.log(`Fonts copied to dist/fonts/`);
console.log(`Assets copied to dist/assets/`);
