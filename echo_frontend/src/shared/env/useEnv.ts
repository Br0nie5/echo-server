import type { EchoEnv } from '@echo/utilities'
import { useContext } from 'react'

import { EnvContext } from '../../initializers/env/EnvContext'

/** The runtime env. Throws outside of `EnvProvider`. */
export const useEnv = (): EchoEnv => {
  const context = useContext(EnvContext)
  if (!context) {
    throw new Error('useEnv must be used within EnvProvider')
  }
  return context.env
}
