<template>
  <div>
    <ApiAlert
      class="mx-4 mt-4"
      :error="syncError"
      :retry-enabled="true"
      @retried="getAlertConfig"
    />
    <ApiAlert class="mx-4 mt-4" :error="testAlertError" @closed="testAlertError = null" />
    <ApiAlert class="mx-4 mt-4" :error="deleteError" @closed="deleteError = null" />
    <v-skeleton-loader
      v-if="alertConfig === null"
      type="card"
      class="my-3 mx-auto w-50"
      elevation="4"
    />
    <v-card v-else class="elevation-2 mx-6 mt-13">
      <AlertConfigBrief
        :alert-config="alertConfig"
        :is-new="$cookies.isKey(alertConfig.alert_config_id)"
      >
        <template #extra-text>
          <v-btn
            append-icon="mdi-pencil"
            color="primary"
            class="ma-3"
            :disabled="syncError !== null"
            @click="openEditDialog"
          >
            Edit Alert
            <v-tooltip activator="parent" location="top">Click to modify this Alert</v-tooltip>
          </v-btn>
        </template>
        <template #footer>
          <div data-test="footer-buttons">
            <v-btn
              append-icon="mdi-test-tube"
              color="orange"
              class="ma-3"
              :disabled="syncError !== null"
              @click="openTestAlertDialog"
            >
              Test Alert
              <v-tooltip activator="parent" location="top">Click to send a test Alert</v-tooltip>
            </v-btn>
            <v-btn
              append-icon="mdi-delete"
              color="primary"
              class="ma-3"
              :disabled="syncError !== null"
              @click="openDeleteDialog"
            >
              Delete Alert
              <v-tooltip activator="parent" location="top">Click to delete this Alert</v-tooltip>
            </v-btn>
          </div>
        </template>
      </AlertConfigBrief>
      <v-card-text class="text-h6">
        Used by:
        <div class="d-flex justify-center" style="width: 100%">
          <v-table style="min-width: 70%" fixed-header>
            <thead class="text-h5">
              <tr>
                <th width="60%">Monitor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody class="text-body-1">
              <tr v-for="monitor in alertConfig.monitors" :key="monitor.monitor_id + monitor.name">
                <td>
                  <v-chip class="text-body-1" color="teal-accent-4" variant="tonal" label>
                    {{ monitor.name }}
                  </v-chip>
                </td>
                <td>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    append-icon="mdi-open-in-app"
                    @click="navigateToMonitor(monitor.monitor_id)"
                  >
                    View
                  </v-btn>
                  <v-btn
                    append-icon="mdi-link-off"
                    color="primary"
                    class="ma-3"
                    :disabled="syncError !== null"
                  >
                    Unlink
                    <v-tooltip activator="parent" location="top">
                      Stop using this Alert for this Monitor
                    </v-tooltip>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>
    </v-card>
    <ConfirmationDialog
      :dialog-active="testAlertDialogActive"
      title="Send test alert?"
      icon="mdi-delete"
      question="This will send a test alert using the given configuration. Are you sure?"
      @dialog-complete="testAlertDialogComplete"
    />
    <ConfirmationDialog
      :dialog-active="deleteDialogActive"
      title="Delete this Monitor?"
      icon="mdi-delete"
      question="This cannot be undone and will result in the jobs within this Monitor also being deleted. Are you sure?"
      @dialog-complete="deleteDialogComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onUnmounted, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AlertConfigBrief from '@/components/AlertConfigBrief.vue'
import ApiAlert from '@/components/ApiAlert.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import type { AlertConfigRepoInterface } from '@/repos/alert-config-repo'
import type { AlertServiceInterface } from '@/services/alert-service'
import type { AlertConfig } from '@/types/alert-config'

const ONE_MINUTE_MS = 60 * 1000

const route = useRoute()
const router = useRouter()
const getAlertConfigRepo = inject<() => Promise<AlertConfigRepoInterface>>(
  '$getAlertConfigRepo'
) as () => Promise<AlertConfigRepoInterface>
const getAlertConfigService = inject<() => Promise<AlertServiceInterface>>(
  '$getAlertConfigService'
) as () => Promise<AlertServiceInterface>

// After we've unmounted the component we don't want to keep syncing the monitor.
let syncing = true
onUnmounted(() => {
  syncing = false
})

const alertConfigId = route.params.id as string
const alertConfig = ref<AlertConfig | null>(null)
const syncError = ref<string | null>(null)
const testAlertError = ref<string | null>(null)
const deleteError = ref<string | null>(null)
const editDialogActive = ref(false)
const testAlertDialogActive = ref(false)
const deleteDialogActive = ref(false)

function openEditDialog() {
  editDialogActive.value = true
}

async function testAlertDialogComplete(confirmed: boolean) {
  if (confirmed) {
    const alertService = await getAlertConfigService()
    try {
      await alertService.sendTestAlert(alertConfig.value as AlertConfig)
      // If we've successfully sent the test alert, we can clear any previous errors.
      testAlertError.value = null
    } catch (e: unknown) {
      testAlertError.value = (e as Error).message
    }
  }

  closeTestAlertDialog()
}

async function deleteDialogComplete(confirmed: boolean) {
  let deleted = false
  const alertConfigRepo = await getAlertConfigRepo()
  if (confirmed) {
    try {
      await alertConfigRepo.deleteAlertConfig(alertConfig.value as AlertConfig)
      deleted = true
    } catch (e: unknown) {
      deleteError.value = (e as Error).message
    }
  }

  closeDeleteDialog()

  // We want to close the dialog first before we navigate back to the alerts page,
  // just because it looks slightly better.
  if (deleted) {
    router.push('/alerts')
  }
}

function openTestAlertDialog() {
  testAlertDialogActive.value = true
}

function closeTestAlertDialog() {
  testAlertDialogActive.value = false
}

function openDeleteDialog() {
  deleteDialogActive.value = true
}

function closeDeleteDialog() {
  deleteDialogActive.value = false
}

// We should be able to use `:to={name: 'monitor', params: { id: monitorId }`
// on the v-btn using this function, but it made mocking the navigation in the tests
// difficult so we're using the router directly.
function navigateToMonitor(monitorId: string) {
  router.push({ name: 'monitor', params: { id: monitorId } })
}

async function getAlertConfig() {
  const alertConfigRepo = await getAlertConfigRepo()
  try {
    alertConfig.value = await alertConfigRepo.getAlertConfig(alertConfigId)
    // If we've successfully got the alert config, we can clear any previous errors.
    syncError.value = null
  } catch (e: unknown) {
    syncError.value = (e as Error).message
  }
}

async function syncAlertConfig() {
  if (!syncing) {
    return
  }

  await getAlertConfig()

  setTimeout(async () => await syncAlertConfig(), ONE_MINUTE_MS)
}

onMounted(syncAlertConfig)
</script>
