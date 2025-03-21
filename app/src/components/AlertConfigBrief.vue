<template>
  <v-card-title class="text-h5" color="primary">
    <v-icon v-if="isNew" class="mr-3" color="primary">mdi-new-box</v-icon>
    <v-icon class="mr-3">
      <v-img :src="SlackIcon"></v-img>
    </v-icon>
    {{ alertConfig.name }}
  </v-card-title>
  <v-card-text>
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
    <slot name="extra-text"></slot>
  </v-card-text>
  <slot name="footer"></slot>
</template>

<script setup lang="ts">
import type { BasicAlertConfig } from '@/types/alert-config'
import SlackIcon from '@/assets/slack-icon.svg'

defineProps<{
  alertConfig: BasicAlertConfig
  isNew: boolean
}>()
</script>
