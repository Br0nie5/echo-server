import { createContext } from 'react'

import type { EnvContextValue } from './types'

/** Holds the runtime env. Read it through `useEnv`. */
export const EnvContext = createContext<EnvContextValue | null>(null)
