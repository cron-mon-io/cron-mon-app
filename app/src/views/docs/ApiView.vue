<template>
  <ApiReference :configuration="ScalarConfig" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const ScalarConfig = ref({
  isEditable: false,
  hideModels: true,
  spec: {
    content: ''
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

onMounted(async () => {
  const openApiSpec = await (await fetch('http://127.0.0.1:8000/api/v1/docs/openapi.yaml')).text()

  // This is a bit of an ugly workaround to allow Scalar to hit the API, since it's
  // running on a different domain.
  // TODO: Figure out how to handle this for local dev and in real deployments.
  ScalarConfig.value.spec.content = openApiSpec + 'servers:\n  - url: http://127.0.0.1:8000'
})
</script>
