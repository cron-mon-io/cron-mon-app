<template>
  <div>
    <ApiAlert class="mx-4 mt-4" :error="syncError" :retry-enabled="true" @retried="getMonitors" />
    <ApiAlert class="mx-4 mt-4" :error="createError" @closed="createError = null" />
    <v-btn
      append-icon="mdi-plus"
      color="primary"
      class="ma-4"
      :disabled="syncError !== null"
      @click="openDialog"
    >
      Add Monitor
      <v-tooltip activator="parent" location="top">Click to add a new monitor</v-tooltip>
    </v-btn>
    <v-skeleton-loader v-if="loading" type="card" class="my-3 mx-auto w-50" elevation="4" />
    <div v-else class="d-flex flex-column align-center">
      <MonitorInfo
        v-for="monitor in monitors"
        :key="monitor.monitor_id"
        :monitor="monitor"
        :is-new="$cookies.isKey(monitor.monitor_id)"
      />
    </div>
    <SetupMonitorDialog
      :dialog-active="dialogActive"
      @dialog-complete="dialogComplete"
      @dialog-aborted="closeDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onUnmounted, onMounted } from 'vue'
import type { VueCookies } from 'vue-cookies'

import ApiAlert from '@/components/ApiAlert.vue'
import MonitorInfo from '@/components/MonitorInfo.vue'
import SetupMonitorDialog from '@/components/SetupMonitorDialog.vue'
import type { MonitorRepoInterface } from '@/repos/monitor-repo'
import type { MonitorInformation, MonitorSummary, Monitor } from '@/types/monitor'

const FIVE_MINUTES_MS = 5 * 60 * 1000

const cookies = inject<VueCookies>('$cookies') as VueCookies
const getMonitorRepo = inject<() => Promise<MonitorRepoInterface>>(
  '$getMonitorRepo'
) as () => Promise<MonitorRepoInterface>

// After we've unmounted the component we don't want to keep syncing the monitor.
let syncing = true
onUnmounted(() => {
  syncing = false
})

const loading = ref(true)
const syncError = ref<string | null>(null)
const createError = ref<string | null>(null)
const monitors = ref<MonitorInformation[]>([])
const dialogActive = ref(false)

async function dialogComplete(monitorInfo: MonitorSummary) {
  let monitor: Monitor | null = null
  const monitorRepo = await getMonitorRepo()
  try {
    monitor = await monitorRepo.addMonitor(monitorInfo)
  } catch (e: unknown) {
    createError.value = (e as Error).message
  }

  if (monitor !== null) {
    cookies.set(monitor.monitor_id, 'new', '5min')
    // We get the list of monitors again here, rather than just inserting the new monitor,
    // so that the list is sorted by the API.
    await getMonitors()
  }

  closeDialog()
}

function openDialog() {
  dialogActive.value = true
}

function closeDialog() {
  dialogActive.value = false
}

async function getMonitors() {
  const monitorRepo = await getMonitorRepo()
  try {
    monitors.value = await monitorRepo.getMonitorInfos()
    // If we've successfully got the monitors, we can clear any previous errors and set loading to false.
    syncError.value = null
    loading.value = false
  } catch (e: unknown) {
    syncError.value = (e as Error).message
  }
}

async function syncMonitors() {
  if (!syncing) {
    return
  }

  await getMonitors()

  setTimeout(async () => await syncMonitors(), FIVE_MINUTES_MS)
}

onMounted(syncMonitors)
</script>
