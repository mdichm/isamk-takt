import type { Config } from 'tailwindcss';
import designTokensConfig from '@takt/design-tokens/tailwind';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      ...designTokensConfig.theme.extend,
    },
  },
  plugins: [],
} satisfies Config;
