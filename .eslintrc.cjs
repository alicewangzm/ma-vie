module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: { browser: true, es2022: true },
  ignorePatterns: ['dist', 'node_modules', 'lookdev.html'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.ts', 'vite.config.ts'],
      env: { node: true },
    },
  ],
};
