import HomeView from '../views/HomeView.vue'
import MonitorsView from '@/views/MonitorsView.vue'
import MonitorView from '@/views/MonitorView.vue'
import SetupView from '@/views/docs/SetupView.vue'
import HostingView from '@/views/docs/HostingView.vue'
import IntegrationView from '@/views/docs/IntegrationView.vue'
import KeysView from '@/views/KeysView.vue'
import AlertView from '@/views/AlertView.vue'
import AlertsView from '@/views/AlertsView.vue'

const routes = [
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
      },
      {
        path: 'hosting',
        name: 'docs-hosting',
        component: HostingView
      }
    ]
  },
  {
    path: '/monitoring',
    name: 'monitoring',
    children: [
      {
        path: 'monitors',
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
      },
      {
        path: 'keys',
        name: 'keys',
        component: KeysView
      },
      {
        path: 'alerts',
        children: [
          {
            path: '',
            name: 'alerts',
            component: AlertsView
          },
          {
            path: ':id',
            name: 'alert',
            component: AlertView
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*', // Catch all 404
    component: () => import('@/views/NotFoundView.vue')
  }
]

export default routes
