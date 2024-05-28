import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MonitorsView from '@/views/MonitorsView.vue'
import MonitorView from '@/views/MonitorView.vue'
import SummaryView from '@/views/docs/SummaryView.vue'
import HostingView from '@/views/docs/HostingView.vue'
import IntegrationView from '@/views/docs/IntegrationView.vue'
import ApiView from '@/views/docs/ApiView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: 'home',
      component: HomeView
    },
    {
      path: '/docs',
      children: [
        {
          path: 'summary',
          name: 'docs-summary',
          component: SummaryView
        },
        {
          path: 'hosting',
          name: 'docs-hosting',
          component: HostingView
        },
        {
          path: 'integration',
          name: 'docs-integration',
          component: IntegrationView
        },
        {
          path: 'api',
          name: 'docs-api',
          component: ApiView
        }
      ]
    },
    {
      path: '/monitors',
      children: [
        {
          path: '',
          name: 'monitors',
          component: MonitorsView
        },
        {
          path: ':id',
          name: 'monitor',
          component: MonitorView
        }
      ]
    }
  ]
})

export default router
