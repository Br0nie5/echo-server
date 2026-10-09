import { useContext } from 'react'

import { ConfigContext } from '../../initializers/config/ConfigContext'

import type { FrontConfig } from './frontConfig'

/** The runtime config of the frontend. Throws outside of `ConfigProvider`. */
export const useConfig = (): FrontConfig => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return context.config
}
