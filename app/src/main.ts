import '@mdi/font/css/materialdesignicons.css'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/common'
import '@scalar/api-reference/style.css'

import { createApp, type App as VueApp } from 'vue'
import VueCookies from 'vue-cookies'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import { ApiReference } from '@scalar/api-reference'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import App from '@/App.vue'
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
  // Adhoc plugin to make the API docs view more testable.
  .use({
    install(app: VueApp) {
      app.component('ApiReference', ApiReference)
    }
  })
  .provide('$localStorage', localStorage)
  .provide('$clipboard', navigator.clipboard)
  .mount('#app')
