import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import ThemePicker from '@/components/ThemePicker.vue'

const LIGHT_ICON_SELECTOR = '.v-btn > .v-btn__content > .mdi-white-balance-sunny'
const DARK_ICON_SELECTOR = '.v-btn > .v-btn__content > .mdi-weather-night'

class LocalStorageMock {
  private data: Record<string, any> = {}

  constructor(data: Record<string, any> = {}) {
    this.data = data
  }

  getItem(key: string) {
    return this.data[key]
  }

  setItem(key: string, value: any) {
    this.data[key] = value
  }

  clear() {
    this.data = {}
  }
}

const vuetify = createVuetify({ components, directives })

describe('ThemePicker component', () => {
  it('renders the default theme without a prior choice', () => {
    const wrapper = mount(ThemePicker, {
      global: {
        plugins: [vuetify],
        provide: {
          $localStorage: new LocalStorageMock()
        }
      }
    })

    // Initial theme-changed event should be emitted with the default theme.
    const events = wrapper.emitted('theme-changed')
    expect(events?.length).toBe(1)
    expect(events?.[0]).toEqual(['dark', true])

    // The icon should reflect the default theme.
    expect(wrapper.find(LIGHT_ICON_SELECTOR).exists()).toBe(true)
    expect(wrapper.find(DARK_ICON_SELECTOR).exists()).toBe(false)
  })

  it('renders the theme that was previously chosen', () => {
    const wrapper = mount(ThemePicker, {
      global: {
        plugins: [vuetify],
        provide: {
          $localStorage: new LocalStorageMock({ theme: 'light' })
        }
      }
    })

    // Initial theme-changed event should be emitted with the previously chosen theme.
    const events = wrapper.emitted('theme-changed')
    expect(events?.length).toBe(1)
    expect(events?.[0]).toEqual(['light', false])

    // The icon should reflect the previously chosen theme.
    expect(wrapper.find(LIGHT_ICON_SELECTOR).exists()).toBe(false)
    expect(wrapper.find(DARK_ICON_SELECTOR).exists()).toBe(true)
  })

  it('toggles the theme when clicked', async () => {
    const wrapper = mount(ThemePicker, {
      global: {
        plugins: [vuetify],
        provide: {
          $localStorage: new LocalStorageMock()
        }
      }
    })

    wrapper.find('.v-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // After the click, the icon should change to indicate that the next click will
    // change the theme back to dark.
    expect(wrapper.find(LIGHT_ICON_SELECTOR).exists()).toBe(false)
    expect(wrapper.find(DARK_ICON_SELECTOR).exists()).toBe(true)

    // The click should trigger a second theme-changed event.
    const events = wrapper.emitted('theme-changed')
    expect(events?.length).toBe(2)
    expect(events?.[1]).toEqual(['light', false])

    wrapper.find('.v-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // After a second click, the icon should change back.
    expect(wrapper.find(LIGHT_ICON_SELECTOR).exists()).toBe(true)
    expect(wrapper.find(DARK_ICON_SELECTOR).exists()).toBe(false)

    // The second click should trigger a third theme-changed event.
    expect(events?.length).toBe(3)
    expect(events?.[2]).toEqual(['dark', true])
  })

  it.each(['atom-dark', 'solar', 'not-dark', 'default'])(
    'ignores invalid theme choices',
    async (choice) => {
      const wrapper = mount(ThemePicker, {
        global: {
          plugins: [vuetify],
          provide: {
            $localStorage: new LocalStorageMock({ theme: choice })
          }
        }
      })

      // Initial theme-changed event should be emitted with the default theme if the persisted choice is invalid.
      const events = wrapper.emitted('theme-changed')
      expect(events?.length).toBe(1)
      expect(events?.[0]).toEqual(['dark', true])
    }
  )
})
