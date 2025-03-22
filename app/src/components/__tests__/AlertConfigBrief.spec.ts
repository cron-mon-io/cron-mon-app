import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import AlertConfigBrief from '../AlertConfigBrief.vue'

describe('AlertConfigBrief component', () => {
  const vuetify = createVuetify({ components, directives })

  it.each([
    {
      isNew: true,
      active: true,
      on_late: true,
      on_error: true,
      chipVariants: ['flat', 'flat', 'flat']
    },
    {
      isNew: false,
      active: false,
      on_late: false,
      on_error: false,
      chipVariants: ['outlined', 'outlined', 'outlined']
    },
    {
      isNew: false,
      active: true,
      on_late: false,
      on_error: true,
      chipVariants: ['flat', 'outlined', 'flat']
    }
  ])('renders as expected', ({ isNew, active, on_late, on_error, chipVariants }) => {
    const wrapper = mount(AlertConfigBrief, {
      global: {
        plugins: [vuetify]
      },
      props: {
        alertConfig: {
          name: 'Test alert config',
          active: active,
          on_late: on_late,
          on_error: on_error,
          type: {
            Slack: {
              token: 'fake-slack-bot-token',
              channel: '#fake-channel'
            }
          }
        },
        isNew: isNew
      }
    })

    // The title should be the alert config name.
    const title = wrapper.find('.v-card-title').text()
    expect(title).toBe('Test alert config')

    // We should display a new icon if the alert config is new.
    const newIcon = wrapper.find('.v-card-title > .mdi-new-box')
    expect(newIcon.exists()).toBe(isNew)

    // We should display the settings in a nicely formatted way.
    const chips = wrapper.findAll('.v-card-text > .v-chip')
    expect(chips.map((chip) => chip.text())).toEqual(['Active', 'On late', 'On error'])
    expect(chips[0].classes()).toContain(`v-chip--variant-${chipVariants[0]}`)
    expect(chips[1].classes()).toContain(`v-chip--variant-${chipVariants[1]}`)
    expect(chips[2].classes()).toContain(`v-chip--variant-${chipVariants[2]}`)
  })
})
