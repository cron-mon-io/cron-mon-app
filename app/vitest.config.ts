import { fileURLToPath } from 'node:url'
import { coverageConfigDefaults, configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/*'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        exclude: [
          'src/main.ts', // Main is just bootstrapping, no logic.
          'src/utils/testing/**', // Testing utilities are just for testing.
          ...coverageConfigDefaults.exclude
        ],
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90
        }
      }
    }
  })
)
