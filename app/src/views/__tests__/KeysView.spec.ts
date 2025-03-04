/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from 'vitest'
import { VueWrapper, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import KeysView from '@/views/KeysView.vue'
import { type ApiKey } from '@/types/api-key'
import { type ApiKeyRepoInterface } from '@/repos/api-key-repo'

import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'

function getTestApiKeyData(): ApiKey[] {
  return [
    {
      api_key_id: '547810d4-a636-4c1b-83e6-3e641391c84e',
      name: 'Key 1',
      masked: '1234************5678',
      created: '2024-06-15T12:00:00',
      last_used: null
    },
    {
      api_key_id: 'fd940a34-684c-4c15-b914-ca7180aa5c8b',
      name: 'Key 2',
      masked: '8765************4321',
      created: '2024-07-27T12:00:00',
      last_used: {
        time: '2024-08-27T12:00:00',
        monitor_name: 'Monitor 1',
        monitor_id: '547810d4-a636-4c1b-83e6-3e641391c84e'
      }
    }
  ]
}

async function mountKeysView(): Promise<{
  wrapper: VueWrapper
  cookies: FakeVueCookies
  repo: ApiKeyRepoInterface
}> {
  const vuetify = createVuetify({ components, directives })

  let TEST_API_KEY_DATA = getTestApiKeyData()

  // The KeysView component uses an async setup, so we need to wrap it in a
  // Suspense component to test it.
  const TestComponent = defineComponent({
    components: { KeysView },
    template: '<Suspense><KeysView/></Suspense>'
  })

  const TestGenerateDialog = defineComponent({
    props: {
      dialogActive: {
        type: Boolean,
        required: true
      }
    },
    emits: ['dialog-complete'],
    watch: {
      dialogActive(active: boolean) {
        if (active) {
          this.$emit('dialog-complete')
        }
      }
    },
    template: '<div>Test dialog</div>'
  })

  const TestConfirmationDialog = defineComponent({
    props: {
      dialogActive: {
        type: Boolean,
        required: true
      },
      dialogData: {
        type: Object,
        required: false,
        default: () => ({})
      }
    },
    emits: ['dialog-complete'],
    watch: {
      dialogActive(active: boolean) {
        if (active) {
          this.$emit('dialog-complete', true)
        }
      }
    },
    template: '<div>Test confirmation dialog</div>'
  })

  const cookies = new FakeVueCookies()

  const repo = {
    getKeys: vi.fn().mockResolvedValue(TEST_API_KEY_DATA),
    revokeKey: vi.fn().mockImplementation(async (apiKeyId) => {
      TEST_API_KEY_DATA = TEST_API_KEY_DATA.filter((key) => key.api_key_id !== apiKeyId)
    }),
    generateKey: vi.fn()
  }

  const wrapper = mount(TestComponent, {
    global: {
      plugins: [vuetify],
      provide: {
        $getApiKeyRepo: () => repo,
        $cookies: cookies
      },
      mocks: {
        $cookies: cookies
      },
      stubs: {
        // We don't want to test the dialog itself as it has its own tests, just that it is opened.
        GenerateApiKeyDialog: TestGenerateDialog,
        ConfirmationDialog: TestConfirmationDialog,
        RouterLink: RouterLinkStub
      }
    }
  })

  await flushPromises()

  return { wrapper, cookies, repo }
}

describe('KeysView view', () => {
  vi.mock('vue-router', () => ({
    useRoute: vi.fn(),
    useRouter: vi.fn(() => ({
      push: () => {}
    }))
  }))

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2024-09-15T12:00:00') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders as expected', async () => {
    // vi.setSystemTime(new Date('2024-09-15T12:00:00'))
    const { wrapper } = await mountKeysView()

    // Should have a button for generating new API keys.
    const button = wrapper.find('.v-btn')
    expect(button.text()).toBe('Generate New Key')

    // Should have a list of existing keys.
    const keyRows = wrapper.find('.v-table').find('tbody').findAll('tr')

    // API KEY column
    expect(keyRows.map((key) => key.find('td').find('div').text())).toEqual(['Key 1', 'Key 2'])
    expect(keyRows.map((key) => key.find('td').find('.v-chip').text())).toEqual([
      '1234************5678',
      '8765************4321'
    ])

    // CREATED column
    expect(keyRows.map((key) => key.findAll('td')[1].text())).toEqual([
      '3 months ago',
      'about 2 months ago'
    ])

    // LAST ACCESS column
    expect(keyRows.map((key) => key.findAll('td')[2].text())).toEqual([
      'Never used',
      '19 days ago  by Monitor 1'
    ])

    // Should have a button for revoking keys.
    const revokeButtons = keyRows.map((key) => key.findAll('td')[3].find('.v-btn').find('.v-icon'))
    expect(revokeButtons.map((btn) => btn.classes().includes('mdi-key-remove'))).toEqual([
      true,
      true
    ])
  })

  it('detects API keys generated externally', async () => {
    const { wrapper, repo } = await mountKeysView()

    // Ensure we have the expected keys to begin with as a sanity check.
    const originalKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(originalKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2'
    ])

    // Add a new key 'externally'.
    ;(repo.getKeys as Mock).mockResolvedValue(
      getTestApiKeyData().concat([
        {
          api_key_id: '06d0d73c-a0ff-4428-81f0-f4118e7beea5',
          name: 'Key 3',
          masked: '2468************8642',
          created: '2024-09-15T12:00:00',
          last_used: null
        }
      ])
    )

    // Simulate 5 minutes passing, by which time we should have re-synced the keys.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // We should now have 3 keys displayed.
    const newKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(newKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2',
      'Key 3'
    ])
  })

  it('can generate a new API key', async () => {
    const { wrapper, repo } = await mountKeysView()

    // Ensure we've synced and have the expected keys to begin with as a sanity check.
    // const mockGetKeys = repo.getKeys as Mock
    expect(repo.getKeys as Mock).toHaveBeenCalledTimes(1)
    const originalKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(originalKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2'
    ])

    // Setup the new key (this is what the dialog would do, but we're mocking it here).
    ;(repo.getKeys as Mock).mockResolvedValue(
      getTestApiKeyData().concat([
        {
          api_key_id: '06d0d73c-a0ff-4428-81f0-f4118e7beea5',
          name: 'New Key',
          masked: '2468************8642',
          created: '2024-09-15T12:00:00',
          last_used: null
        }
      ])
    )

    // Clicking the Generate New Key button will trigger our test dialog, which will imediately complete.
    const generateKeyButton = wrapper.find('.v-btn')
    expect(generateKeyButton.text()).toBe('Generate New Key')
    await generateKeyButton.trigger('click')
    await flushPromises()

    // When the dialog completes we should re-sync the keys.
    expect(repo.getKeys as Mock).toHaveBeenCalledTimes(2)

    // We should now have 3 keys displayed.
    const newKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(newKeyRows).toHaveLength(3)
    expect(newKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2',
      'New Key'
    ])
  })

  it('can revoke an existing API key', async () => {
    const { wrapper } = await mountKeysView()

    // Ensure we have the expected keys to begin with as a sanity check.
    const originalKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(originalKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2'
    ])

    // Click the revoke button on the first key.
    const revokeButton = originalKeyRows[0].find('.v-btn')
    await revokeButton.trigger('click')
    await flushPromises()

    // We should now have only one key displayed.
    const newKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(newKeyRows.map((key) => key.find('td').find('div').text())).toEqual(['Key 2'])
  })

  it('stops syncing when the component is unmounted', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountKeysView()
    const mockGetKeys = repo.getKeys as Mock

    // Let the KeysView component sync.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure the sync happened. This is a sanity check to ensure the component is syncing
    // as expected.
    expect(mockGetKeys.mock.calls).toHaveLength(2)

    // Unmount the component then allow enough time for another sync to happen.
    await wrapper.unmount()
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure no more syncs happened.
    expect(mockGetKeys.mock.calls).toHaveLength(2)

    vi.useRealTimers()
  })

  it('can handle errors when syncing API keys', async () => {
    vi.useFakeTimers()
    const { wrapper, repo } = await mountKeysView()

    // Ensure we have the expected keys to begin with as a sanity check.
    const originalKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(originalKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2'
    ])

    // Simulate an error when retrieving keys.
    ;(repo.getKeys as Mock).mockRejectedValue(new Error('Test error'))

    // Let the KeysView component sync.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // We should have an alert displayed with the error message.
    const alert = wrapper.find('.v-alert').find('.api-alert-content')
    expect(alert.find('span').text()).toBe('Test error')

    // We should still have the same keys displayed.
    const newKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(newKeyRows.map((key) => key.find('td').find('div').text())).toEqual(['Key 1', 'Key 2'])

    vi.useRealTimers()
  })

  it('can handle errors when revoking an API key', async () => {
    const { wrapper, repo } = await mountKeysView()

    // Ensure we have the expected keys to begin with as a sanity check.
    const originalKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(originalKeyRows.map((key) => key.find('td').find('div').text())).toEqual([
      'Key 1',
      'Key 2'
    ])

    // Simulate an error when revoking a key.
    ;(repo.revokeKey as Mock).mockRejectedValue(new Error('Test error'))

    // Click the revoke button on the first key.
    const revokeButton = originalKeyRows[0].find('.v-btn')
    await revokeButton.trigger('click')
    await flushPromises()

    // We should have an alert displayed with the error message.
    const alert = wrapper.find('.v-alert').find('.api-alert-content')
    expect(alert.find('span').text()).toBe('Test error')

    // We should still have the same keys displayed.
    const newKeyRows = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(newKeyRows.map((key) => key.find('td').find('div').text())).toEqual(['Key 1', 'Key 2'])
  })
})
