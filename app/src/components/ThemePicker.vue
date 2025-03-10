<template>
  <v-btn density="comfortable" :icon="appliedTheme.icon" @click="toggleTheme"></v-btn>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'

enum ThemeName {
  Dark = 'dark',
  Light = 'light'
}

enum ThemeIcon {
  ToDark = 'mdi-weather-night',
  ToLight = 'mdi-white-balance-sunny'
}

interface Theme {
  name: ThemeName
  icon: ThemeIcon
}

const THEMES: Record<string, Theme> = {
  [ThemeName.Dark]: {
    name: ThemeName.Dark,
    icon: ThemeIcon.ToLight
  },
  [ThemeName.Light]: {
    name: ThemeName.Light,
    icon: ThemeIcon.ToDark
  }
}

const localStore = inject<Storage>('$localStorage')

function getThemeName(): ThemeName {
  const persisted = localStore?.getItem('theme')
  const themeName = persisted as ThemeName
  return persisted === null || ![ThemeName.Dark, ThemeName.Light].includes(themeName)
    ? ThemeName.Dark
    : themeName
}

const emit = defineEmits<{
  (e: 'theme-changed', name: string, isDark: boolean): void
}>()

const themeName = ref(getThemeName())
const appliedTheme = computed(() => THEMES[themeName.value])

function toggleTheme() {
  themeName.value = themeName.value === ThemeName.Dark ? ThemeName.Light : ThemeName.Dark
  localStore?.setItem('theme', themeName.value)
  emit('theme-changed', themeName.value, themeName.value === ThemeName.Dark)
}

emit('theme-changed', themeName.value, themeName.value === ThemeName.Dark)
</script>
