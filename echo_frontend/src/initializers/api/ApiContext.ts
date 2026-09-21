import { createContext } from 'react'

import type { ApiContextValue } from './types'

/** Holds the axios instance. Read it through `useApi`. */
export const ApiContext = createContext<ApiContextValue | null>(null)
