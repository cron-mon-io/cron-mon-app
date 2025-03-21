<template>
  <v-card class="elevation-4 mt-3 mb-6 w-50">
    <AlertConfigBrief :alert-config="alertConfig" :is-new="isNew">
      <template #extra-text>
        <v-chip prepend-icon="mdi-monitor-eye" color="teal-accent-4" density="compact" label>
          Used by {{ alertConfig.monitors }} monitors
        </v-chip>
      </template>
      <template #footer>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="elevated"
            append-icon="mdi-open-in-app"
            @click="navigateToAlertConfig"
          >
            View
          </v-btn>
        </v-card-actions>
      </template>
    </AlertConfigBrief>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import AlertConfigBrief from './AlertConfigBrief.vue'
import type { AlertConfigSummary } from '@/types/alert-config'

const props = defineProps<{
  alertConfig: AlertConfigSummary
  isNew: boolean
}>()
const router = useRouter()

// We should be able to use `:to={name: 'monitor', params: { id: monitor.monitor_id } }`
// on the v-btn using this function, but it made mocking the navigation in the tests
// difficult so we're using the router directly.
function navigateToAlertConfig() {
  router.push({ name: 'alerts', params: { id: props.alertConfig.alert_config_id } })
}
</script>
