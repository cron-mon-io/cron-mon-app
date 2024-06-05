import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import MonitorSummary from '@/components/MonitorSummary.vue'

const vuetify = createVuetify({ components, directives })

describe('MonitorSummary component', () => {
  it.each([true, false])('renders as expected', (isNew) => {
    const wrapper = mount(MonitorSummary, {
      global: {
        plugins: [vuetify]
      },
      props: {
        monitor: {
          name: 'Test Monitor',
          expected_duration: 5430,
          grace_duration: 600
        },
        isNew: isNew
      }
    })

    // The title should be the monitor name.
    const title = wrapper.find('.v-card-title').text()
    expect(title).toBe('Test Monitor')

    // We should display a new icon if the monitor is new.
    const newIcon = wrapper.find('.v-card-title > .mdi-new-box')
    expect(newIcon.exists()).toBe(isNew)

    // We should display the durations in a nicely formatted way.
    const durationSpans = wrapper.findAll('.v-card-subtitle > span').map((span) => span.text())
    expect(durationSpans).toEqual(['Expected duration: 01:30:30', 'Grace duration: 00:10:00'])
  })
})
