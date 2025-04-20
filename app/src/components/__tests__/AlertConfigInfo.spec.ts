import { describe, it, expect, vi } from 'vitest'
import type { Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { useRouter } from 'vue-router'

import AlertConfigInfo from '../AlertConfigInfo.vue'

describe('AlertConfigInfo component', () => {
  const vuetify = createVuetify({ components, directives })
  vi.mock('vue-router', () => ({
    useRoute: vi.fn(),
    useRouter: vi.fn(() => ({
      push: () => {}
    }))
  }))

  it.each([
    { isNew: true, monitors: 1, usedByMessage: 'Used by 1 monitor' },
    { isNew: false, monitors: 2, usedByMessage: 'Used by 2 monitors' },
    { isNew: false, monitors: 0, usedByMessage: 'Used by 0 monitors' }
  ])('renders as expected', ({ isNew, monitors, usedByMessage }) => {
    const wrapper = mount(AlertConfigInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        alertConfig: {
          alert_config_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          name: 'Test alert config',
          active: true,
          on_late: true,
          on_error: false,
          monitors: monitors,
          type: {
            slack: {
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

    // We should display the number of monitors using this alert config.
    // (We don't care about the 1st 3 chips here as those come from the AlertConfigBrief
    // component, and so are covered in said components tests.
    const chips = wrapper.findAll('.v-card-text > .v-chip')
    expect(chips).toHaveLength(4)
    expect(chips[3].text()).toBe(usedByMessage)

    // We should have a view button.
    const viewButton = wrapper.find('.v-card-actions > .v-btn')
    expect(viewButton.text()).toBe('View')
  })

  it('naviates to specific alert config page as expected', async () => {
    const push = vi.fn()
    ;(useRouter as Mock).mockImplementationOnce(() => ({
      push
    }))

    const wrapper = mount(AlertConfigInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        alertConfig: {
          alert_config_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          name: 'Test alert config',
          active: true,
          on_late: true,
          on_error: false,
          monitors: 2,
          type: {
            slack: {
              token: 'fake-slack-bot-token',
              channel: '#fake-channel'
            }
          }
        },
        isNew: false
      }
    })

    const viewButton = wrapper.find('.v-card-actions > .v-btn')
    await viewButton.trigger('click')

    expect(push).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith({
      name: 'alert',
      params: {
        id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574'
      }
    })
  })
})
