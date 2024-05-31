<template>
  <v-card variant="elevated" class="mx-6 mt-13">
    <v-card-title class="font-weight-black">Integration</v-card-title>
    <v-card-text class="text-body-1">
      Once you have set up your Monitor(s), you can integrate CronMon with your existing
      applications, either by using one of the pre-built integration packages/ libraries or by using
      the simple REST API.
      <br />
      <br />
      In order to use your Monitor in your cronjob or application, you'll need the ID of your
      Monitor. You can get this from your Monitor here in the CronMon app - simply go to
      <router-link :to="{ name: 'monitors' }" target="_blank" rel="noreferrer noopener">
        the Monitors page
      </router-link>
      , find your Monitor and <i>view</i> it, then click on the Monitor ID to copy it to your
      clipboard.
      <br />
      <br />
      <v-img class="mx-auto" max-width="800px" src="/src/assets/monitor-id.gif" alt="Monitor ID" />
      <br />
      <br />
      From here, you can use your Monitor ID with CronMon to monitors your cronjobs and tasks in
      your application. This will ultimately boil down to telling CronMon when your cronjob or task
      starts and ends. Below are some examples of how to use CronMon in your applications using
      various programming languages. Details of the REST API can be found in the
      <router-link :to="{ name: 'docs-api' }">API documentation</router-link>.

      <v-card class="mt-4">
        <v-tabs v-model="tab">
          <v-tab value="python">
            <v-icon class="mr-1">
              <v-img aspect-ratio="16/9" :src="PythonIcon"></v-img>
            </v-icon>
            Python
          </v-tab>
          <v-tab value="shell"> <v-icon class="mr-1" icon="mdi-console-line"></v-icon>Shell </v-tab>
          <v-tab value="more">
            <v-icon class="mr-1" icon="mdi-dots-horizontal"></v-icon>
            More
          </v-tab>
          <v-spacer />
          <v-btn class="mr-2 my-auto" density="comfortable" icon="" @click="copyToClipboard">
            <v-icon>mdi-content-copy</v-icon>
            <v-tooltip activator="parent">Copy example to clipboard</v-tooltip>
          </v-btn>
        </v-tabs>

        <v-card-text>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="python" class="text-body-1">
              <highlightjs language="python" :code="examples['python']" />
              <br />
              <v-alert type="info" density="compact" variant="tonal">
                The <code>cron-mon</code> Python package doesn't exist yet - but it will soon!
              </v-alert>
            </v-tabs-window-item>
            <v-tabs-window-item value="shell" class="text-body-1">
              <highlightjs language="bash" :code="examples['shell']" />
              <br />
              <v-alert type="info" density="compact" variant="tonal">
                This example uses <a href="https://jqlang.github.io/jq/"><code>jq</code></a> as well
                as <code>curl</code> to make the API call.
              </v-alert>
            </v-tabs-window-item>
            <v-tabs-window-item value="more" class="text-body-1">
              CronMon is still in the early stages of development, so this is it for now, but there
              will be more examples coming soon!
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import PythonIcon from '@/assets/python.svg'

const pythonExample = `from cron_mon import monitor

# Replace <your-monitor-id> with your actual Monitor ID
@monitor("<your-monitor-id>")
def cron_job():
    """Your cron job code here."""
    ...
  `

const shellExample = `# Start the job. Ensure your environment has the MONITOR_ID set to your actual Monitor ID.
job_id=$(eval \\
    curl -X POST --silent \\
    http://127.0.0.1:8000/api/v1/monitors/\${MONITOR_ID}/jobs/start | jq -r '.data.job_id')

# Run the job.
output=$(eval ./cronjob.sh)

# Finish the job.
curl -X POST --silent \\
     -H 'Content-Type: application/json' \\
     --data '{"succeeded": true, "output": "'"$(echo \${output})"'"}' \\
     http://127.0.0.1:8000/api/v1/monitors/\${MONITOR_ID}/jobs/\${job_id}/finish > /dev/null
`

const tab = ref('python')
const examples = ref<{
  [key: string]: string
}>({
  python: pythonExample,
  shell: shellExample
})

function copyToClipboard() {
  navigator.clipboard.writeText(examples.value[tab.value])
}
</script>
