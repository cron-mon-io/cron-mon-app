import type { VueCookies } from 'vue-cookies'

interface Cookie {
  value: unknown
  expires?: string | number | Date
}

export class FakeVueCookies implements VueCookies {
  private cookies: Record<string, Cookie> = {}

  config(
    _expires: string | number | Date,
    _path?: string,
    _domain?: string,
    _secure?: boolean,
    _sameSite?: string,
    _partitioned?: boolean
  ): void {
    throw new Error('Method not implemented.')
  }

  get(keyName: string): unknown {
    const cookie = this.cookies[keyName]
    return cookie === undefined ? null : cookie.value
  }

  isKey(keyName: string): boolean {
    return keyName in this.cookies
  }

  keys(): string[] {
    return Object.keys(this.cookies)
  }

  remove(keyName: string, _path?: string, _domain?: string): boolean {
    delete this.cookies[keyName]
    return true
  }

  set(
    keyName: string,
    value: unknown,
    expires?: string | number | Date,
    _path?: string,
    _domain?: string,
    _secure?: boolean,
    _sameSite?: string
  ): this {
    this.cookies[keyName] = {
      value: value,
      expires: expires
    }
    return this
  }
}
