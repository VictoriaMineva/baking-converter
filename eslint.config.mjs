import stencil from '@stencil/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'loader', 'www', '.stencil', '.vitest-attachments', 'src/components.d.ts'] },
  {
    ...stencil.configs.flat.recommended,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...stencil.configs.flat.recommended.languageOptions,
      parserOptions: {
        ...stencil.configs.flat.recommended.languageOptions?.parserOptions,
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettier,
];
