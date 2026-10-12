import { useContext } from 'react'

import { ConfigContext } from './ConfigContext'
import type { FrontConfig } from './frontConfig'

/**
 * Gives the config of the app.
 *
 * Throws outside of `ConfigProvider`.
 */
export const useConfig = (): FrontConfig => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return context.config
}
