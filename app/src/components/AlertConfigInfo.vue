<template>
  <v-card class="elevation-4 ma-3 w-50">
    <AlertConfigSummary :alert-config="alertConfig" :is-new="isNew">
      <template #extra-text>
        <v-chip prepend-icon="mdi-eye-off-outline" color="teal-accent-4" density="compact" label>
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
    </AlertConfigSummary>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import AlertConfigSummary from './AlertConfigSummary.vue'
import type { AlertConfig } from '@/types/alert-config'

const props = defineProps<{
  alertConfig: AlertConfig
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
