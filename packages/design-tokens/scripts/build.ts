import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read the source tokens - use relative path to copied JSON file
const tokensPath = join(rootDir, 'src', 'tokens', 'TAKT_design_tokens_v2_3_6.json');
const tokens = JSON.parse(readFileSync(tokensPath, 'utf-8'));

function flattenTokens(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTokens(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(value);
    }
  }
  return result;
}

const flatTokens = flattenTokens(tokens);

// Generate CSS variables
const cssVars = Object.entries(flatTokens)
  .map(([key, value]) => `  --${key}: ${value};`)
  .join('\n');

const cssOutput = `:root {\n${cssVars}\n}\n`;

// Generate Tailwind config
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

// Write output files
const distDir = join(rootDir, 'dist');
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

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

export default {} satisfies Config;
`);

console.log('Design tokens built successfully!');
console.log(`Generated ${Object.keys(flatTokens).length} CSS variables`);
