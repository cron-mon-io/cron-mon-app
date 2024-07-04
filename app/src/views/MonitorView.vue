<template>
  <div>
    <ApiAlert class="mx-4 mt-4" :error="syncError" :retryEnabled="true" @retried="getMonitor" />
    <ApiAlert class="mx-4 mt-4" :error="editError" @closed="editError = null" />
    <ApiAlert class="mx-4 mt-4" :error="deleteError" @closed="deleteError = null" />
    <v-skeleton-loader
      v-if="monitor === null"
      type="card"
      class="my-3 mx-auto w-50"
      elevation="4"
    />
    <v-card v-else class="elevation-2 mx-6 mt-13">
      <MonitorSummary :monitor="monitor" :is-new="$cookies.isKey(monitor.monitor_id)" />
      <v-card-text>
        <v-chip
          append-icon="mdi-content-copy"
          color="teal-accent-4"
          @click="copyMonitorIDToClipboard"
          class="text-body-1 font-weight-bold ma-2"
          variant="tonal"
          label
        >
          Monitor ID: <code>{{ monitor.monitor_id }}</code>
          <v-tooltip activator="parent" location="top">
            You'll need this to use the monitor in your cron job, see the docs for more.
          </v-tooltip>
        </v-chip>
        <v-btn
          append-icon="mdi-pencil"
          color="primary"
          class="ma-3"
          @click="openEditDialog"
          :disabled="syncError !== null"
        >
          Edit Monitor
          <v-tooltip activator="parent" location="top">Click to modify this Monitor</v-tooltip>
        </v-btn>
        <v-btn
          append-icon="mdi-delete"
          color="primary"
          class="ma-3"
          @click="openDeleteDialog"
          :disabled="syncError !== null"
        >
          Delete Monitor
          <v-tooltip activator="parent" location="top">Click to delete this Monitor</v-tooltip>
        </v-btn>
        <!--
          When the key changes Vue will re-render the component so using `late` and `succeeded`
          in the key means that as jobs become late or are finished we'll trigger a re-render.
          This is a bit of a hack but it works for now. TODO: Find a better way to do this.
        -->
        <JobInfo
          v-for="job in monitor.jobs"
          :key="job.job_id + job.late + job.succeeded"
          :job="job"
        />
      </v-card-text>
    </v-card>
    <SetupMonitorDialog
      v-if="monitor !== null"
      :dialogActive="editDialogActive"
      @dialog-complete="editDialogComplete"
      @dialog-aborted="closeEditDialog"
      :monitor="monitor"
    />
    <ConfirmationDialog
      :dialogActive="deleteDialogActive"
      title="Delete this Monitor?"
      icon="mdi-delete"
      question="This cannot be undone and will result in the jobs within this Monitor also being deleted. Are you sure?"
      @dialog-complete="deleteDialogComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onUnmounted } from 'vue'
import type { VueCookies } from 'vue-cookies'
import { useRoute, useRouter } from 'vue-router'

import ApiAlert from '@/components/ApiAlert.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import JobInfo from '@/components/JobInfo.vue'
import MonitorSummary from '@/components/MonitorSummary.vue'
import SetupMonitorDialog from '@/components/SetupMonitorDialog.vue'
import type { MonitorRepoInterface } from '@/repos/monitor-repo'
import type {
  MonitorSummary as MonitorSummaryType,
  MonitorInformation,
  Monitor,
  MonitorIdentity
} from '@/types/monitor'

const ONE_MINUTE_MS = 60 * 1000

const route = useRoute()
const router = useRouter()
const cookies = inject<VueCookies>('$cookies') as VueCookies
const monitorRepo = inject<MonitorRepoInterface>('$monitorRepo') as MonitorRepoInterface
const clipboard = inject<Clipboard>('$clipboard') as Clipboard

// After we've unmounted the component we don't want to keep syncing the monitor.
let syncing = true
onUnmounted(() => {
  syncing = false
})

const monitorId = route.params.id as string
const monitor = ref<Monitor | null>(null)
const syncError = ref<string | null>(null)
const deleteError = ref<string | null>(null)
const editError = ref<string | null>(null)
const editDialogActive = ref(false)
const deleteDialogActive = ref(false)

function copyMonitorIDToClipboard() {
  clipboard.writeText(monitorId)
}

async function editDialogComplete(monitorInfo: MonitorSummaryType) {
  const newMonitor = {
    monitor_id: monitorId,
    ...monitorInfo
  } as MonitorInformation

  try {
    monitor.value = await monitorRepo.updateMonitor(newMonitor)
    cookies.set(monitor.value.monitor_id, 'new', '5min')
  } catch (e: unknown) {
    editError.value = (e as Error).message
  }
  closeEditDialog()
}

function openEditDialog() {
  editDialogActive.value = true
}

function closeEditDialog() {
  editDialogActive.value = false
}

async function deleteDialogComplete(confirmed: boolean) {
  let deleted = false
  if (confirmed) {
    try {
      await monitorRepo.deleteMonitor(monitor.value as MonitorIdentity)
      deleted = true
    } catch (e: unknown) {
      deleteError.value = (e as Error).message
    }
  }

  closeDeleteDialog()

  // We want to close the dialog first before we navigate back to the monitors page,
  // just because it looks slightly better.
  if (deleted) {
    router.push('/monitors')
  }
}

function openDeleteDialog() {
  deleteDialogActive.value = true
}

function closeDeleteDialog() {
  deleteDialogActive.value = false
}

async function getMonitor() {
  try {
    monitor.value = await monitorRepo.getMonitor(monitorId)
    // If we've successfully got the monitors, we can clear any previous errors.
    syncError.value = null
  } catch (e: unknown) {
    syncError.value = (e as Error).message
  }
}

async function syncMonitor() {
  if (!syncing) {
    return
  }

  await getMonitor()

  setTimeout(async () => await syncMonitor(), ONE_MINUTE_MS)
}

await syncMonitor()
</script>
