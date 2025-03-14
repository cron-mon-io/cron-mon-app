<template>
  <div>
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
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const syncError = ref<string | null>(null)
const createAlertDialogOpen = ref(false)
</script>
