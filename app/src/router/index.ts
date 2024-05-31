import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MonitorsView from '@/views/MonitorsView.vue'
import MonitorView from '@/views/MonitorView.vue'
import SetupView from '@/views/docs/SetupView.vue'
import HostingView from '@/views/docs/HostingView.vue'
import IntegrationView from '@/views/docs/IntegrationView.vue'

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
          path: 'setup',
          name: 'docs-setup',
          component: SetupView
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
          // Lazy load the API docs since we use https://github.com/scalar/scalar/tree/main
          // which is a large dependency.
          component: () => import('@/views/docs/ApiView.vue')
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
