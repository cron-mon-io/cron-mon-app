<template>
  <div>
    <ApiAlert class="mx-4 mt-4" :error="syncError" :retryEnabled="true" @retried="getApiKeys" />
    <ApiAlert class="mx-4 mt-4" :error="revokeError" @closed="revokeError = null" />
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
        <v-table height="400px" style="width: 100%" fixed-header>
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
              <td class="py-4">
                <div>
                  {{ formatLastUsed(key.created) }}
                  <v-tooltip activator="parent" location="top">
                    {{ key.created }}
                  </v-tooltip>
                </div>
              </td>
              <td v-if="key.last_used" class="py-4">
                <div>
                  {{ formatLastUsed(key.last_used.time) }}
                  <v-tooltip activator="parent" location="top">
                    {{ key.last_used.time }}
                  </v-tooltip>
                </div>
                by
                <router-link
                  :to="{ name: 'monitor', params: { id: key.last_used.monitor_id } }"
                  target="_blank"
                  rel="noreferrer noopener"
                  >{{ key.last_used.monitor_name }}</router-link
                >
              </td>
              <td v-else class="py-4 text-disabled">Never used</td>
              <td><v-btn icon="mdi-key-remove" @click="openRevokeKeyDialog(key)"></v-btn></td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    <GenerateApiKeyDialog
      :dialogActive="openGenerateKeyDialog"
      @dialog-aborted="generateDialogComplete"
      @dialog-complete="generateDialogComplete"
    />
    <ConfirmationDialog
      :dialogActive="keyToRevoke !== null"
      title="Revoke this API Key?"
      icon="mdi-key-remove"
      question="Are you sure you want to revoke this API key? It will not be usable anymore, and this cannot be undone."
      @dialog-complete="revokeDialogComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onUnmounted, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'

import ApiAlert from '@/components/ApiAlert.vue'
import type { ApiKeyRepoInterface } from '@/repos/api-key-repo'
import type { ApiKey } from '@/types/api-key'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import GenerateApiKeyDialog from '@/components/GenerateApiKeyDialog.vue'

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
const revokeError = ref<string | null>(null)
const apiKeys = ref<ApiKey[]>([])
const openGenerateKeyDialog = ref(false)
const keyToRevoke = ref<ApiKey | null>(null)

function generateKey() {
  openGenerateKeyDialog.value = true
}

function openRevokeKeyDialog(key: ApiKey) {
  keyToRevoke.value = key
}

function closeRevokeDialog() {
  keyToRevoke.value = null
}

async function revokeDialogComplete(confirmed: boolean) {
  const apiKeyRepo = await getApiKeyRepo()
  if (confirmed) {
    try {
      await apiKeyRepo.revokeKey(keyToRevoke.value as ApiKey)
      // If we've successfully revoked the key, we can remove it from the list.
      apiKeys.value = apiKeys.value.filter(
        (key) => key.api_key_id !== keyToRevoke.value?.api_key_id
      )
    } catch (e: unknown) {
      revokeError.value = (e as Error).message
    }
  }

  closeRevokeDialog()
}

async function generateDialogComplete() {
  openGenerateKeyDialog.value = false
  await getApiKeys()
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
