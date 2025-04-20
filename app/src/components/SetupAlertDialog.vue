<template>
  <v-dialog
    :model-value="active"
    :attach="attach"
    width="auto"
    @keyup.esc="exit"
    @after-leave="exit"
    @keyup.enter="finish"
  >
    <v-card min-width="500">
      <v-card-title prepend-icon="mdi-update">{{ title }}</v-card-title>
      <v-card-text>
        <v-form v-model="formValid">
          <v-text-field
            v-model="name"
            class="mt-5"
            hint="Give your alert a name"
            persistent-hint
            label="Name"
            clearable
            variant="outlined"
          ></v-text-field>
          <span class="d-flex">
            <v-checkbox
              v-model="isActive"
              class="mr-4"
              label="Active"
              variant="outlined"
            ></v-checkbox>
            <v-checkbox
              v-model="onLate"
              class="ml-4"
              label="Alert for lates"
              variant="outlined"
            ></v-checkbox>
            <v-checkbox
              v-model="onError"
              class="mx-4"
              label="Alert for errors"
              variant="outlined"
            ></v-checkbox>
          </span>
          <div v-if="typeSetup">
            <v-select
              v-model="alertType"
              :readonly="!typeSetup"
              :disabled="!typeSetup"
              :items="['Slack', 'Webhook']"
              class="mt-5"
              hint="How do you want to be alerted?"
              persistent-hint
              label="Alert type"
              variant="outlined"
            />
            <div v-if="alertType === 'Slack'">
              <v-text-field
                v-model="slackChannel"
                class="mt-5"
                hint="Slack channel to send alerts to"
                persistent-hint
                label="Slack channel"
                clearable
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="slackToken"
                class="mt-5"
                hint="Bot user OAuth token for the Slack app"
                persistent-hint
                label="Slack token"
                clearable
                variant="outlined"
              ></v-text-field>
            </div>
          </div>
          <div v-else class="text-h6">
            Type:
            <!-- TODO: Make this dynamic -->
            <v-icon>
              <v-img :src="SlackIcon"></v-img>
            </v-icon>
            Slack
          </div>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn
          text="Cancel"
          color="orange"
          variant="tonal"
          append-icon="mdi-close-circle"
          @click="exit"
        ></v-btn>
        <v-btn
          text="Save"
          color="primary"
          variant="elevated"
          append-icon="mdi-check-circle"
          :disabled="!canSave"
          :loading="loading"
          @click="finish"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject } from 'vue'
import SlackIcon from '@/assets/slack-icon.svg'

import type { BasicAlertConfig } from '@/types/alert-config'

const props = defineProps<{
  dialogActive: boolean
  alertConfig?: BasicAlertConfig | null
}>()
const emit = defineEmits<{
  (e: 'dialog-complete', alertConfig: BasicAlertConfig): void
  (e: 'dialog-aborted'): void
}>()

const attach = inject<boolean>('noTeleport', false)

const title = props.alertConfig ? 'Edit Alert' : 'Create new Alert'
const typeSetup = props.alertConfig ? false : true
const name = ref(props.alertConfig ? props.alertConfig.name : '')
const isActive = ref(props.alertConfig ? props.alertConfig.active : false)
const onError = ref(props.alertConfig ? props.alertConfig.on_error : false)
const onLate = ref(props.alertConfig ? props.alertConfig.on_late : false)
const alertType = ref('Slack')
const slackChannel = ref(props.alertConfig ? props.alertConfig.type.slack.channel : '')
const slackToken = ref(props.alertConfig ? props.alertConfig.type.slack.token : '')

const formValid = ref(false)
const loading = ref(false)
const active = computed(() => props.dialogActive)
const canSave = computed(() => {
  if (!formValid.value || name.value.length === 0) {
    return false
  }

  // If we haven't been supplied with an alert config, we need to make sure the alert type
  // is valid.
  if (!props.alertConfig) {
    if (alertType.value === 'Slack') {
      if (slackChannel.value.length === 0 || slackToken.value.length === 0) {
        return false
      }
    }
  }

  return true
})
const monitorInfo = computed(
  () =>
    ({
      name: name.value,
      active: isActive.value,
      on_late: onLate.value,
      on_error: onError.value,
      type: {
        slack: {
          channel: slackChannel.value,
          token: slackToken.value
        }
      }
    }) as BasicAlertConfig
)

// When the parent component closes the dialog, we want to set loading back to false.
watch(active, (newActive, oldActive) => {
  if (oldActive && !newActive) {
    loading.value = false
  }
})

function exit() {
  emit('dialog-aborted')
}

async function finish() {
  loading.value = true
  emit('dialog-complete', monitorInfo.value)
}
</script>
