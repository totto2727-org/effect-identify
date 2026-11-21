// oxlint-disable-next-line rules/no-node-imports -- Vite+ runs this configuration on Node.
import { URL } from 'node:url'

import { generateIgnorePatterns } from '@totto2727/gitignore-patterns'
import preset from '@totto2727/oxlint/preset/library'
import { defineConfig } from 'vite-plus'

const ignorePatterns = await generateIgnorePatterns(new URL('.', import.meta.url))

// oxlint-disable-next-line import/no-default-export -- Vite+ loads its configuration from the default export.
export default defineConfig({
  fmt: {
    arrowParens: 'always',
    experimentalSortImports: {
      ignoreCase: true,
      newlinesBetween: true,
      order: 'asc',
    },
    experimentalSortPackageJson: true,
    ignorePatterns,
    jsxSingleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    semi: false,
    singleQuote: true,
  },
  lint: {
    ...preset,
    ignorePatterns,
    options: { ...preset.options, typeCheck: true },
    overrides: [
      ...(preset.overrides ?? []),
      // Keep the established public entry point.
      { files: ['src/index.ts'], rules: { 'rules/no-index-filename': 'off' } },
    ],
  },
  pack: { clean: true, dts: true, entry: ['src/index.ts'], format: ['esm'], platform: 'neutral' },
  run: {
    tasks: {
      build: {
        cache: {
          input: [{ auto: true }, '!dist/**'],
          output: ['dist/**'],
        },
        command: 'vp pack',
      },
      check: {
        command: 'vp check',
      },
      ci: {
        command: '',
        dependsOn: ['check', 'test', 'build'],
      },
      fix: {
        command: 'vp check --fix',
      },
      test: {
        command: 'vp test run',
      },
    },
  },
  test: { include: ['src/**/*.test.ts'] },
})
