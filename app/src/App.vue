<template>
  <v-theme-provider class="app-container" :theme="themeName" with-background>
    <v-app>
      <v-navigation-drawer :rail="rail" :mobile="false">
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

        <v-list v-model:opened="opened" density="compact" nav>
          <v-list-item
            v-for="link in topLevelLinks"
            :key="link.target"
            link
            :prepend-icon="link.icon"
            :to="{ name: link.target }"
          >
            <v-list-item-title class="text-body-1">{{ link.name }}</v-list-item-title>
          </v-list-item>
          <v-list-group value="monitoring">
            <template #activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-monitor-eye">
                <v-list-item-title class="text-body-1">Monitoring</v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item
              v-for="link in monitorLinks"
              :key="link.target"
              link
              :prepend-icon="link.icon"
              :to="{ name: link.target }"
            >
              <v-list-item-title class="text-body-1">{{ link.name }}</v-list-item-title>
            </v-list-item>
          </v-list-group>
          <v-list-group value="docs">
            <template #activator="{ props }">
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
          <v-btn
            density="comfortable"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click="rail = !rail"
          ></v-btn>
          <v-spacer></v-spacer>
          <span v-if="user">
            Hello, {{ user.firstName }}
            <IconButton
              icon="mdi-account"
              tooltip="Open account management"
              @click="openAccountManagement"
            />
            <IconButton icon="mdi-logout" tooltip="Log out" @click="logout" />
          </span>
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
import IconButton from './components/IconButton.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import { useAuth } from '@/composables/auth'
import { MonitorRepository } from '@/repos/monitor-repo'
import { ApiKeyRepository } from './repos/api-key-repo'

import { ref, provide } from 'vue'

const rail = ref(false)
const themeName = ref('') // This will be set by the ThemePicker during setup/initialisation.
const themeIsDark = ref(true)
const opened = ref(['docs'])

// Navigation links
const topLevelLinks = ref([{ icon: 'mdi-home', target: 'home', name: 'Home' }])
const monitorLinks = ref([
  { icon: 'mdi-monitor-multiple', target: 'monitors', name: 'Monitors' },
  { icon: 'mdi-key-variant', target: 'keys', name: 'API Keys' }
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
const { user, logout, openAccountManagement, getToken, isReady } = useAuth([
  'monitors',
  'monitor',
  'keys'
])
console.log('User: ', user)
provide('$getMonitorRepo', async () => {
  await isReady()
  return new MonitorRepository(() => getToken() || '')
})
provide('$getApiKeyRepo', async () => {
  await isReady()
  return new ApiKeyRepository(() => getToken() || '')
})
</script>
