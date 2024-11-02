<template>
  <ApiAlert class="mx-4 mt-4" :error="syncError" :retryEnabled="true" @retried="getApiKeys" />
  <v-card class="elevation-2 mx-6 mt-13">
    <v-card-title class="font-weight-black"> API Keys</v-card-title>
    <v-card-text>
      <div class="text-body-1">
        <p>In order to integrate with Cron Mon you'll need an API key.</p>
        <p>
          Your existing keys are listed below and you can create a new key via the
          <i>Generate New Key</i> button below.
        </p>
      </div>
      <v-btn
        append-icon="mdi-plus"
        color="primary"
        class="my-4"
        :disabled="syncError !== null"
        @click="generateKey"
      >
        Generate New Key
        <v-tooltip activator="parent" location="top">Click to generate a new API key</v-tooltip>
      </v-btn>
      <v-table height="300px" style="width: 100%" fixed-header>
        <thead>
          <tr>
            <th class="text-left" style="width: 30%">API KEY</th>
            <th class="text-left" style="width: 25%">CREATED</th>
            <th class="text-left" style="width: 40%">LAST ACCESS</th>
            <th class="text-left" style="width: 5%">&nbsp;</th>
          </tr>
        </thead>
        <tbody class="text-body-1">
          <tr v-for="key in apiKeys" :key="key.api_key_id">
            <td class="py-4">
              <div class="text-h6">{{ key.name }}</div>
              <v-chip
                prepend-icon="mdi-eye-off-outline"
                color="teal-accent-4"
                density="compact"
                label
                >{{ key.masked }}</v-chip
              >
            </td>
            <td class="py-4">{{ formatLastUsed(key.created) }}</td>
            <td v-if="key.last_used" class="py-4">
              {{ formatLastUsed(key.last_used.time) }} by
              <router-link
                :to="{ name: 'monitor', params: { id: key.last_used.monitor_id } }"
                target="_blank"
                rel="noreferrer noopener"
                >{{ key.last_used.monitor_name }}</router-link
              >
            </td>
            <td v-else class="py-4 text-disabled">Never used</td>
            <td><v-btn icon="mdi-key-remove" @click="revokeKey(key)"></v-btn></td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, inject, onUnmounted, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'

import ApiAlert from '@/components/ApiAlert.vue'
import type { ApiKeyRepoInterface } from '@/repos/api-key-repo'
import type { ApiKey } from '@/types/api-key'

const FIVE_MINUTES_MS = 5 * 60 * 1000

const getApiKeyRepo = inject<() => Promise<ApiKeyRepoInterface>>(
  '$getApiKeyRepo'
) as () => Promise<ApiKeyRepoInterface>

// After we've unmounted the component we don't want to keep syncing the monitor.
let syncing = true
onUnmounted(() => {
  syncing = false
})

const loading = ref(true)
const syncError = ref<string | null>(null)
const apiKeys = ref<ApiKey[]>([])

function generateKey() {
  alert('Not implemented yet!')
}

function revokeKey(_key: ApiKey) {
  alert('Not implemented yet!')
}

function formatLastUsed(lastUsed: string): string {
  return formatDistanceToNow(new Date(lastUsed), { addSuffix: true })
}

async function getApiKeys() {
  const apiKeyRepo = await getApiKeyRepo()
  try {
    apiKeys.value = await apiKeyRepo.getKeys()
    // If we've successfully got the keys, we can clear any previous errors and set loading to false.
    syncError.value = null
    loading.value = false
  } catch (e: unknown) {
    syncError.value = (e as Error).message
  }
}

async function syncApiKeys() {
  if (!syncing) {
    return
  }

  await getApiKeys()

  setTimeout(async () => await syncApiKeys(), FIVE_MINUTES_MS)
}

onMounted(syncApiKeys)
</script>
