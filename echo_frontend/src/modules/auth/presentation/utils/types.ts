import type { AlertColor } from '@mui/material'

import type { AuthCheckResult } from '../../domain/auth.repository'

/** Message shown above the auth form. */
export interface AuthAlert {
  severity: AlertColor
  message: string
}

/** How the user authenticates: `login` into an account, or `signUp` of the first one. These are the auth check results that ask for credentials. */
export type AuthenticationMode = Exclude<AuthCheckResult, 'redirect'>
