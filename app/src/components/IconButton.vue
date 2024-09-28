<template>
  <v-tooltip location="bottom">
    <template v-slot:activator="{ props }">
      <v-btn density="comfortable" v-bind="props" icon @click="$emit('click')">
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  tooltip: string
}>()
defineEmits<{
  (e: 'click'): void
}>()
</script>
