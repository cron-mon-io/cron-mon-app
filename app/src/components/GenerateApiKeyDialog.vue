<template>
  <v-dialog
    :model-value="active"
    :attach="attach"
    width="auto"
    :persistent="generatedKey !== null"
    @after-leave="escape"
    @keyup.esc="escape"
    @keyup.enter="enter"
  >
    <v-card min-width="500">
      <v-card-title prepend-icon="mdi-key-variant">Generate New API Key</v-card-title>
      <div v-if="generatedKey === null">
        <v-card-text>
          <ApiAlert class="mx-4 mt-4" :error="generateError" @closed="generateError = null" />
          <v-form @submit.prevent>
            <v-text-field
              class="mt-5"
              hint="A name to help you identify this key"
              persistent-hint
              label="Name"
              v-model="name"
              clearable
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text="Cancel"
            @click="abort"
            color="orange"
            variant="tonal"
            append-icon="mdi-close-circle"
          ></v-btn>
          <v-btn
            text="Generate Key"
            @click="generate"
            color="primary"
            variant="elevated"
            append-icon="mdi-check-circle"
            :disabled="!canGenerate"
            :loading="loading"
          ></v-btn>
        </v-card-actions>
      </div>
      <div v-else>
        <v-card-text class="pt-0">
          <v-chip
            class="mb-4"
            width="100%"
            prepend-icon="mdi-alert"
            color="warning"
            variant="outlined"
            label
          >
            Please copy this token to a safe place — it won't be shown again!
          </v-chip>
          <p>Your new API key has been generated.</p>
          <p>
            <strong>Key:</strong>
            <v-chip
              append-icon="mdi-content-copy"
              color="teal-accent-4"
              @click="copyGeneratedKey"
              class="text-body-1 font-weight-bold ma-2"
              variant="tonal"
              label
            >
              <code>{{ generatedKey }}</code>
            </v-chip>
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text="Done"
            @click="finish"
            color="primary"
            variant="elevated"
            append-icon="mdi-check-circle"
          ></v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject } from 'vue'

import type { MonitorSummary } from '@/types/monitor'
import type { ApiKeyRepoInterface } from '@/repos/api-key-repo'
import ApiAlert from '@/components/ApiAlert.vue'

const props = defineProps<{
  dialogActive: boolean
  monitor?: MonitorSummary | null
}>()
const emit = defineEmits<{
  (e: 'dialog-complete'): void
  (e: 'dialog-aborted'): void
}>()

const attach = inject<boolean>('noTeleport', false)
const clipboard = inject<Clipboard>('$clipboard') as Clipboard
const getApiKeyRepo = inject<() => Promise<ApiKeyRepoInterface>>(
  '$getApiKeyRepo'
) as () => Promise<ApiKeyRepoInterface>

const active = computed(() => props.dialogActive)
const canGenerate = computed(() => name.value.length > 0 && generateError.value === null)
const generateError = ref<string | null>(null)
const loading = ref(false)
const name = ref('')
const generatedKey = ref<string | null>(null)

// When the parent component closes the dialog, we want to reset all state.
watch(active, (newActive, oldActive) => {
  if (oldActive && !newActive) {
    loading.value = false
    name.value = ''
    generatedKey.value = null
  }
})

function escape() {
  if (generatedKey.value === null) {
    abort()
  }
}

async function enter() {
  if (generatedKey.value === null) {
    await generate()
  } else {
    finish()
  }
}

function abort() {
  emit('dialog-aborted')
}

function finish() {
  emit('dialog-complete')
}

function copyGeneratedKey() {
  // The elements that invoke this are only ever displayed if we have a generated key.
  clipboard.writeText(generatedKey.value as string)
}

async function generate() {
  loading.value = true
  const repo = await getApiKeyRepo()
  try {
    generatedKey.value = await repo.generateKey(name.value)
  } catch (e: unknown) {
    generateError.value = `Error generating key: ${(e as Error).message}`
  }
  loading.value = false
}
</script>
