<template>
  <div>
    <ApiReference :configuration="scalarConfig" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// TODO: Figure out how to handle this for local dev and in real deployments.
const API_URL = 'http://127.0.0.1:8000'
const scalarConfig = ref({
  isEditable: false,
  hideModels: true,
  spec: {
    url: `${API_URL}/api/v1/docs/openapi.yaml`
  },
  servers: [
    {
      url: API_URL,
      description: 'Cron Mon API server'
    }
  ],
  // Limit the clients shown for the time being, just to make the page look a bit cleaner.
  hiddenClients: {
    c: ['libcurl'],
    clojure: ['clj_http'],
    java: ['unirest'],
    javascript: ['axios', 'jquery'],
    node: ['axios', 'request', 'undici', 'unirest'],
    objc: ['nsurlsession'],
    ocaml: ['cohttp'],
    php: ['curl', 'guzzle', 'http1', 'http2'],
    python: ['python3'],
    r: ['httr'],
    ruby: ['native'],
    shell: ['httpie'],
    swift: ['nsurlsession']
  }
})
</script>
