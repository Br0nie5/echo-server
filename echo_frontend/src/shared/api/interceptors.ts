import type { AxiosError } from 'axios'

import type { FrontConfig } from '../config/frontConfig'
import { AppPathNames } from '../navigation/pathNames'

/** On a 401, goes to the auth screen, passing the current page as `redirect` to come back after logging in. */
export function interceptUnauthenticatedError(error: AxiosError, config: FrontConfig): void {
  if (error?.status === 401) {
    const redirect = encodeURIComponent(window.location.href)
    window.location.href = `${config.APP_URL}${AppPathNames.auth}?redirect=${redirect}`
  }
}
