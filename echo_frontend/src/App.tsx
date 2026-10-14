import React from 'react'

import { AppProviders } from './initializers/AppProviders'
import { AppRouter } from './initializers/navigation/AppRouter'

/** The root component of the app: its router, inside its providers. */
export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
