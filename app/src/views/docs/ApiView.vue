<template>
  <api-reference :configuration="ScalarConfig" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const openApiSpec = await (await fetch('http://127.0.0.1:8000/api/v1/docs/openapi.yaml')).text()

const ScalarConfig = ref({
  isEditable: false,
  hideModels: true,
  spec: {
    // This is a bit of an ugly workaround to allow Scalar to hit the API, since it's
    // running on a different domain.
    // TODO: Figure out how to handy this for local dev and in real deployments.
    content: openApiSpec.replace('- url: /api/v1', '- url: http://127.0.0.1:8000/api/v1')
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
