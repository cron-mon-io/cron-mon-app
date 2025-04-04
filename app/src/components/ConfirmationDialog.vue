<template>
  <v-dialog
    :model-value="active"
    width="auto"
    :attach="attach"
    @keyup.esc="abort"
    @after-leave="abort"
    @keyup.enter="confirm"
  >
    <v-card max-width="500">
      <v-card-title :prepend-icon="icon">{{ title }}</v-card-title>
      <v-card-text>{{ question }}</v-card-text>
      <v-card-actions>
        <v-btn
          text="No"
          color="orange"
          variant="tonal"
          append-icon="mdi-close-circle"
          @click="abort"
        ></v-btn>
        <v-btn
          text="Yes"
          color="primary"
          variant="elevated"
          append-icon="mdi-check-circle"
          :loading="loading"
          @click="confirm"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject } from 'vue'

const props = defineProps<{
  dialogActive: boolean
  title: string
  icon: string
  question: string
}>()
const emit = defineEmits<{
  (e: 'dialog-complete', confirmed: boolean): void
}>()

const attach = inject<boolean>('noTeleport', false)

const loading = ref(false)
const active = computed(() => props.dialogActive)

// When the parent component closes the dialog, we want to set loading back to false.
watch(active, (newActive, oldActive) => {
  if (oldActive && !newActive) {
    loading.value = false
  }
})

function abort() {
  emit('dialog-complete', false)
}

function confirm() {
  loading.value = true
  emit('dialog-complete', true)
}
</script>
