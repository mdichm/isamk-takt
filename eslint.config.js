const js = require('@eslint/js');
const typescriptEslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'build/**', '.turbo/**', '*.config.*'] },
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...typescriptEslint.configs.stylistic,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@takt/*'],
              message: 'Use workspace protocol (workspace:*) for internal packages'
            }
          ]
        }
      ]
    }
  }
];