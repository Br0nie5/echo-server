import type { AlertColor } from '@mui/material'

import type { TranslationKey } from '../../../../shared/i18n/useAppTranslation'
import type { AuthCheckResult } from '../../domain/auth.repository'

/** A message displayed above the auth form. */
export interface AuthAlert {
  severity: AlertColor
  /** The key of the text of the message. */
  messageKey: TranslationKey
}

/**
 * How the user authenticates: `login` into an account, or `signUp` of the first one.
 *
 * These are the results of the auth check that ask for credentials.
 */
export type AuthenticationMode = Exclude<AuthCheckResult, 'redirect'>
