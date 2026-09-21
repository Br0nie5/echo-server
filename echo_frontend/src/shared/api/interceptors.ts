import type { EchoEnv } from '@echo/utilities'
import type { AxiosError } from 'axios'

import { AppPathNames } from '../navigation/pathNames'

/** On a 401, goes to the auth screen, passing the current page as `redirect` to come back after logging in. */
export function interceptUnauthenticatedError(error: AxiosError, env: EchoEnv): void {
  if (error?.status === 401) {
    const redirect = encodeURIComponent(window.location.href)
    window.location.href = `${env.APP_URL}${AppPathNames.auth}?redirect=${redirect}`
  }
}
