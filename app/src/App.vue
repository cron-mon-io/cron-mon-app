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
          <v-list-item link prepend-icon="mdi-home" :to="{ name: 'home' }">
            <v-list-item-title class="text-body-1">Home</v-list-item-title>
          </v-list-item>
          <v-list-item link prepend-icon="mdi-monitor-eye" :to="{ name: 'monitors' }">
            <v-list-item-title class="text-body-1">Monitors</v-list-item-title>
          </v-list-item>
          <v-list-group value="docs">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-bookshelf">
                <v-list-item-title class="text-body-1">Docs</v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item link prepend-icon="mdi-math-compass" :to="{ name: 'docs-summary' }">
              <v-list-item-title class="text-body-1">Summary</v-list-item-title>
            </v-list-item>
            <v-list-item link prepend-icon="mdi-server-plus" :to="{ name: 'docs-hosting' }">
              <v-list-item-title class="text-body-1">Hosting</v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              prepend-icon="mdi-application-braces"
              :to="{ name: 'docs-integration' }"
            >
              <v-list-item-title class="text-body-1">Integration</v-list-item-title>
            </v-list-item>
            <v-list-item link prepend-icon="mdi-test-tube" :to="{ name: 'docs-api' }">
              <v-list-item-title class="text-body-1">API</v-list-item-title>
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
          <a href="https://github.com/howamith/cron-mon" target="_blank" rel="noopener noreferrer">
            <v-btn flat density="comfortable" icon>
              <template v-slot:default>
                <GitHubIcon :dark="themeIsDark" />
              </template>
            </v-btn>
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
const themeName = ref('')
const themeIsDark = ref(true)
const opened = ref(['docs'])

function updateTheme(name: string, isDark: boolean): void {
  themeName.value = name
  themeIsDark.value = isDark
}
</script>
