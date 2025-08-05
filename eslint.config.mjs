// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended, 
  ...tseslint.configs.recommended, 
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'jest.config.js'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // 允许使用any，因为visitor模式需要泛型
    },
  }
);
