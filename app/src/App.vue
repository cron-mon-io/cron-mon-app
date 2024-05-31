<template>
  <v-theme-provider class="app-container" :theme="themeName" with-background>
    <v-app>
      <v-navigation-drawer :rail="rail">
        <v-list-item class="d-flex justify-center pa-0" :height="80">
          <v-img
            :width="rail ? 40 : 230"
            :height="rail ? 40 : 45"
            cover
            aspect-ratio="16/9"
            :src="rail ? CronMonIcon : CronMonLogo"
          ></v-img>
        </v-list-item>
        <v-divider></v-divider>

        <v-list density="compact" nav v-model:opened="opened">
          <v-list-item
            v-for="link in topLevelLinks"
            :key="link.target"
            link
            :prepend-icon="link.icon"
            :to="{ name: link.target }"
          >
            <v-list-item-title class="text-body-1">{{ link.name }}</v-list-item-title>
          </v-list-item>
          <v-list-group value="docs">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-bookshelf">
                <v-list-item-title class="text-body-1">Docs</v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item
              v-for="link in docLinks"
              :key="link.target"
              link
              :prepend-icon="link.icon"
              :to="{ name: link.target }"
            >
              <v-list-item-title class="text-body-1">{{ link.name }}</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-toolbar density="compact">
          <v-btn density="comfortable" @click="rail = !rail" icon="mdi-dots-vertical"></v-btn>
          <v-spacer></v-spacer>
          <ThemePicker @theme-changed="updateTheme" />
        </v-toolbar>
        <RouterView class="mb-3" />
        <v-footer app absolute class="text-center d-flex flex-column">
          <a href="https://github.com/cron-mon-io" target="_blank" rel="noopener noreferrer">
            <v-btn flat density="comfortable" :icon="GitHubIcon"></v-btn>
          </a>
          <div>&copy; {{ new Date().getFullYear() }} — <strong>CronMon</strong></div>
        </v-footer>
      </v-main>
    </v-app>
  </v-theme-provider>
</template>

<script setup lang="ts">
import CronMonLogo from '@/assets/logo.svg'
import CronMonIcon from '@/assets/icon.svg'
import GitHubIcon from '@/components/icons/GitHub.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import { ref } from 'vue'

const rail = ref(false)
const themeName = ref('') // This will be set by the ThemePicker during setup/initialisation.
const themeIsDark = ref(true)
const opened = ref(['docs'])
const topLevelLinks = ref([
  { icon: 'mdi-home', target: 'home', name: 'Home' },
  { icon: 'mdi-monitor-eye', target: 'monitors', name: 'Monitors' }
])
const docLinks = ref([
  { icon: 'mdi-math-compass', target: 'docs-setup', name: 'Setup' },
  { icon: 'mdi-application-braces', target: 'docs-integration', name: 'Integration' },
  { icon: 'mdi-test-tube', target: 'docs-api', name: 'API' },
  { icon: 'mdi-server-plus', target: 'docs-hosting', name: 'Hosting' }
])

function updateTheme(name: string, isDark: boolean): void {
  themeName.value = name
  themeIsDark.value = isDark
}
</script>
