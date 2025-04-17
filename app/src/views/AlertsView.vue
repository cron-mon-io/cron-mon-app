<template>
  <div>
    <ApiAlert
      class="mx-4 mt-4"
      :error="syncError"
      :retry-enabled="true"
      @retried="getAlertConfigs"
    />
    <ApiAlert class="mx-4 mt-4" :error="createError" :retry-enabled="false" />
    <v-card class="elevation-2 mx-6 mt-13">
      <v-card-title class="font-weight-black">Alerts</v-card-title>
      <v-card-text>
        <div class="text-body-1">
          <p>Cron Mon can alert you when your jobs are late or if they fail</p>
          <p>
            Your configured alerts are listed below, and you can configure new ones via the
            <i>Setup New Alert</i> button below.
          </p>
        </div>
        <v-btn
          append-icon="mdi-plus"
          color="primary"
          class="my-4"
          :disabled="syncError !== null"
          @click="createAlertDialogOpen = true"
        >
          Setup New Alert
          <v-tooltip activator="parent" location="top">Click to setup a new Alert</v-tooltip>
        </v-btn>
      </v-card-text>
      <v-skeleton-loader v-if="loading" type="card" class="my-3 mx-auto w-50" elevation="4" />
      <div v-else class="d-flex flex-column align-center">
        <AlertConfigInfo
          v-for="alertConfig in alertConfigs"
          :key="alertConfig.alert_config_id"
          :alert-config="alertConfig"
          :is-new="$cookies.isKey(alertConfig.alert_config_id)"
        />
      </div>
    </v-card>
    <SetupAlertDialog
      :dialog-active="createAlertDialogOpen"
      @dialog-complete="addAlert"
      @dialog-aborted="closeDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onUnmounted, onMounted } from 'vue'

import ApiAlert from '@/components/ApiAlert.vue'
import type { AlertConfigRepoInterface } from '@/repos/alert-config-repo'
import type { AlertConfig, AlertConfigSummary, BasicAlertConfig } from '@/types/alert-config'
import AlertConfigInfo from '@/components/AlertConfigInfo.vue'
import SetupAlertDialog from '@/components/SetupAlertDialog.vue'

const FIVE_MINUTES_MS = 5 * 60 * 1000

const getAlertConfigRepo = inject<() => Promise<AlertConfigRepoInterface>>(
  '$getAlertConfigRepo'
) as () => Promise<AlertConfigRepoInterface>

// After we've unmounted the component we don't want to keep syncing the alert confgigs.
let syncing = true
onUnmounted(() => {
  syncing = false
})

const loading = ref(true)
const syncError = ref<string | null>(null)
const createError = ref<string | null>(null)
const alertConfigs = ref<AlertConfigSummary[]>([])
const createAlertDialogOpen = ref(false)

async function addAlert(alertConfig: BasicAlertConfig) {
  let alert: AlertConfig | null = null
  const repo = await getAlertConfigRepo()
  try {
    alert = await repo.addAlertConfig(alertConfig)
  } catch (e: unknown) {
    createError.value = (e as Error).message
  }

  if (alert !== null) {
    // We get the list of monitors again here, rather than just inserting the new monitor,
    // so that the list is sorted by the API.
    await getAlertConfigs()
  }

  closeDialog()
}

function closeDialog() {
  createAlertDialogOpen.value = false
}

async function getAlertConfigs() {
  const alertConfigRepo = await getAlertConfigRepo()
  try {
    alertConfigs.value = await alertConfigRepo.getAlertConfigs()
    // If we've successfully got the keys, we can clear any previous errors and set loading to false.
    syncError.value = null
    loading.value = false
  } catch (e: unknown) {
    syncError.value = (e as Error).message
  }
}

async function syncAlertConfigs() {
  if (!syncing) {
    return
  }

  await getAlertConfigs()

  setTimeout(async () => await syncAlertConfigs(), FIVE_MINUTES_MS)
}

onMounted(syncAlertConfigs)
</script>
