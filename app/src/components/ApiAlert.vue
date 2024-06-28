<template>
  <v-alert
    :model-value="error !== null"
    title="API Error"
    color="error"
    variant="outlined"
    icon="mdi-sync-alert"
    prominent
    :closable="!retryEnabled"
    @click:close="$emit('closed')"
  >
    <template v-slot:text>
      <!-- api-alert-content class is purely to aid in testing here. -->
      <div class="api-alert-content d-flex">
        <span>{{ error }}</span>
        <v-spacer />
        <v-btn v-if="retryEnabled" @click="$emit('retried')" color="error" append-icon="mdi-reload">
          Retry
        </v-btn>
      </div>
    </template>
  </v-alert>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    error: string | null
    retryEnabled?: boolean
  }>(),
  {
    retryEnabled: false
  }
)
defineEmits<{
  (e: 'closed'): void
  (e: 'retried'): void
}>()
</script>
