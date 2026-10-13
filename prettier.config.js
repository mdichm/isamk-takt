{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-organize-imports"],
  "overrides": [
    {
      "files": ["*.json", "*.yaml", "*.yml"],
      "options": { "tabWidth": 2 }
    },
    {
      "files": ["*.md"],
      "options": { "proseWrap": "always" }
    }
  ]
}