<template>
  <v-card class="elevation-4 ma-3 w-50">
    <v-card-title class="text-h5" color="primary">
      <v-icon v-if="isNew" class="mr-3" color="primary">mdi-new-box</v-icon>
      <v-icon class="mr-3">
        <v-img :src="SlackIcon"></v-img>
      </v-icon>
      {{ alertConfig.name }}
    </v-card-title>
    <v-card-actions>
      <v-chip
        class="ma-2 font-weight-bold"
        color="info"
        :variant="alertConfig.active ? 'flat' : 'outlined'"
      >
        <v-icon icon="mdi-bell-ring" start></v-icon>
        Active
      </v-chip>
      <v-chip
        class="ma-2 font-weight-bold"
        color="info"
        :variant="alertConfig.on_late ? 'flat' : 'outlined'"
      >
        <v-icon icon="mdi-timer-alert" start></v-icon>
        On late
      </v-chip>
      <v-chip
        class="ma-2 font-weight-bold"
        color="info"
        :variant="alertConfig.on_error ? 'flat' : 'outlined'"
      >
        <v-icon icon="mdi-close-circle" start></v-icon>
        On error
      </v-chip>
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
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import type { AlertConfig } from '@/types/alert-config'
import SlackIcon from '@/assets/slack-icon.svg'

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
