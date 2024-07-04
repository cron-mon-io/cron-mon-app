import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import ApiAlert from '@/components/ApiAlert.vue'

describe('ApiAlert component', () => {
  const vuetify = createVuetify({ components, directives })

  it('is not rendered when not active', () => {
    const wrapper = mount(ApiAlert, {
      global: {
        plugins: [vuetify]
      },
      props: {
        error: null
      }
    })

    expect(wrapper.html()).toBeFalsy()
  })

  it('is rendered when active', () => {
    const wrapper = mount(ApiAlert, {
      global: {
        plugins: [vuetify]
      },
      props: {
        error: 'Test error message'
      }
    })

    expect(wrapper.html()).toBeTruthy()

    expect(wrapper.find('.v-alert-title').text()).toBe('API Error')

    const content = wrapper.find('.api-alert-content')
    expect(content.find('span').text()).toBe('Test error message')

    const button = wrapper.find('.v-btn')
    expect(button.find('.mdi').classes()).toContain('mdi-close')
  })

  it('is rendered with retry when active', () => {
    const wrapper = mount(ApiAlert, {
      global: {
        plugins: [vuetify]
      },
      props: {
        error: 'Test error message',
        retryEnabled: true
      }
    })

    expect(wrapper.html()).toBeTruthy()

    expect(wrapper.find('.v-alert-title').text()).toBe('API Error')

    const content = wrapper.find('.api-alert-content')
    expect(content.find('span').text()).toBe('Test error message')

    const button = content.find('.v-btn')
    expect(button.find('.mdi').classes()).toContain('mdi-reload')
    expect(button.text()).toBe('Retry')
  })

  it('emits the closed event when the close button is clicked', async () => {
    const wrapper = mount(ApiAlert, {
      global: {
        plugins: [vuetify]
      },
      props: {
        error: 'Test error message'
      }
    })

    await wrapper.find('.v-btn').trigger('click')

    expect(wrapper.emitted('closed')).toHaveLength(1)
  })

  it('emits the retry event when the retry button is clicked', async () => {
    const wrapper = mount(ApiAlert, {
      global: {
        plugins: [vuetify]
      },
      props: {
        error: 'Test error message',
        retryEnabled: true
      }
    })

    await wrapper.find('.v-btn').trigger('click')

    expect(wrapper.emitted('retried')).toHaveLength(1)
  })
})
