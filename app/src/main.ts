import '@mdi/font/css/materialdesignicons.css'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/common'

import { createApp } from 'vue'
import VueCookies from 'vue-cookies'
import hljsVuePlugin from '@highlightjs/vue-plugin'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import App from '@/App.vue'
import { MonitorRepository } from '@/repos/monitor-repo'
import router from '@/router'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})

createApp(App)
  .use(router)
  .use(vuetify)
  .use(VueCookies)
  .use(hljsVuePlugin)
  .provide('$localStorage', localStorage)
  .provide('$monitorRepo', new MonitorRepository())
  .mount('#app')
