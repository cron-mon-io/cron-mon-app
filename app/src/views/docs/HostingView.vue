<template>
  <v-card variant="elevated" class="mx-6 mt-13">
    <v-card-title class="font-weight-black">Hosting</v-card-title>
    <v-card-text class="text-body-1">
      CronMon <i>currently</i> isn't hosted anywhere, but you can run it yourself! The CronMon app
      and API are both open source and available on GitHub. You can run the app and API on your own
      server, or use a service like Heroku to host it for you.
      <v-list lines="one">
        <v-list-item v-for="repo in githubRepos" :key="repo.name">
          <br />
          <v-list-item-title
            ><v-icon class="mr-2" :icon="GitHubIcon" />{{ repo.name }}</v-list-item-title
          >
          <v-list-item-subtitle
            ><a :href="repo.url" target="_blank" rel="noopener noreferrer">{{
              repo.url
            }}</a></v-list-item-subtitle
          >
        </v-list-item>
      </v-list>
      <br />
      <v-alert type="info" density="compact" variant="tonal">
        Both the CronMon app and API have Docker images which you can build from source and run. In
        the future, we'll provide pre-built images on the GitHub Container Registry.
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import GitHubIcon from '@/components/icons/GitHub.vue'

const githubRepos = [
  { name: 'cron-mon-app', url: 'https://github.com/cron-mon-io/cron-mon-app' },
  { name: 'cron-mon', url: 'https://github.com/cron-mon-io/cron-mon' }
]
</script>
