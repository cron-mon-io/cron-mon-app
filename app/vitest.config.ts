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
          'src/components/icons/**', // Icons are just SVGs, no logic.
          'src/main.ts', // Main is just bootstrapping, no logic.
          'src/router/**', // Router is just configuration, no logic.
          'src/utils/testing/**', // Testing utilities are just for testing.
          'src/views/docs/**', // Docs are just content, no logic.
          'src/views/HomeView.vue', // Home page is just content, no logic.
          'src/views/NotFoundView.vue', // 404 is just a placeholder, no logic.
          ...coverageConfigDefaults.exclude
        ],
        thresholds: {
          lines: 95,
          functions: 95,
          branches: 95,
          statements: 95
        }
      }
    }
  })
)
