import { createContext } from 'react'

import type { FrontConfig } from './frontConfig'

/** What the `ConfigProvider` of `initializers/` provides. */
export interface ConfigContextValue {
  config: FrontConfig
}

/** Holds the runtime config, `null` outside of `ConfigProvider`. Read it through `useConfig`. */
export const ConfigContext = createContext<ConfigContextValue | null>(null)
