type ApiResponse = {
  data: any
}

export class ApiRepository {
  private readonly baseUrl = import.meta.env.VITE_API_HOST
  protected readonly getAuthToken: () => string

  constructor(getAuthToken: () => string) {
    this.getAuthToken = getAuthToken
  }

  protected async sendRequest(
    route: string,
    method: string,
    body: Record<string, any> | undefined = undefined
  ): Promise<ApiResponse | undefined> {
    const opts: Record<string, any> = {
      method: method,
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`
      }
    }
    if (body !== undefined) {
      opts.headers.Accept = 'application/json'
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }

    let response: Response | null = null
    try {
      response = await fetch(`${this.baseUrl}${route}`, opts)
    } catch (e) {
      console.error('Failed to connect to the CronMon API:', e)
      throw new Error('Failed to connect to the CronMon API.')
    }

    if (response.ok) {
      const length = Number(response.headers.get('Content-Length'))
      return length > 0 ? await response.json() : undefined
    } else {
      // We always want the JSON out of errors to get the description.
      const json = await response.json()
      throw new Error(json.error.description)
    }
  }
}
