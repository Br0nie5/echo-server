import type { Config } from '@echo/utilities'
import { useContext } from 'react'

import { ConfigContext } from '../../initializers/config/ConfigContext'

/** The runtime config. Throws outside of `ConfigProvider`. */
export const useConfig = (): Config => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return context.config
}
