<template>
  <div>
    <ApiReference :configuration="scalarConfig" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const scalarConfig = ref({
  isEditable: false,
  hideModels: true,
  spec: {
    url: '/api/v1/docs/openapi.yaml'
  },
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
