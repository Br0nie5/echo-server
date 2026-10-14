import type { AlertColor } from '@mui/material'

import type { TranslationKey } from '../../../../shared/i18n/useAppTranslation'

/** A message displayed above the auth form. */
export interface AuthAlert {
  severity: AlertColor
  /** The key of the text of the message. */
  messageKey: TranslationKey
}

/** What the credentials form does: `login` into an account, or `signUp` of the first one. */
export type AuthFormMode = 'login' | 'signUp'
