import { createContext } from 'react'

import type { ConfigContextValue } from './types'

/** Holds the runtime config. Read it through `useConfig`. */
export const ConfigContext = createContext<ConfigContextValue | null>(null)
