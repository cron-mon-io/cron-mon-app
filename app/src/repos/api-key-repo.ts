import type { ApiKey } from '@/types/api-key'
import { ApiRepository } from './api-repo'

type ApiKeyList = {
  data: Array<ApiKey>
  paging: {
    total: number
  }
}

type NewApiKey = {
  data: {
    key: string
  }
}

export interface ApiKeyRepoInterface {
  getKeys(): Promise<Array<ApiKey>>
  generateKey(name: string): Promise<string>
  revokeKey(key: ApiKey): Promise<void>
}

export class ApiKeyRepository extends ApiRepository implements ApiKeyRepoInterface {
  constructor(getAuthToken: () => string) {
    super(getAuthToken)
  }

  async getKeys(): Promise<Array<ApiKey>> {
    const resp = await this.sendRequest(`/api/v1/keys`, 'GET')
    return (resp as ApiKeyList).data
  }

  async generateKey(name: string): Promise<string> {
    const resp = await this.sendRequest(`/api/v1/keys`, 'POST', { name })
    return (resp as NewApiKey).data.key
  }

  async revokeKey(key: ApiKey): Promise<void> {
    await this.sendRequest(`/api/v1/keys/${key.api_key_id}`, 'DELETE')
  }
}
