<template>
  <api-reference :configuration="ScalarConfig" />
</template>

<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { ref } from 'vue'

const ScalarConfig = ref({
  isEditable: false,
  hideModels: true,
  spec: {
    url: 'http://127.0.0.1:8000/api/v1/docs/openapi.yaml'
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
