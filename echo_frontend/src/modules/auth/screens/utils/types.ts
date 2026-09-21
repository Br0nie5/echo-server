import type { AlertColor } from '@mui/material'

/** Message shown above the auth form. */
export interface AuthAlert {
  severity: AlertColor
  message: string
}

interface OnFormSubmitParams {
  username: string
  password: string
  setAlert: (alert: AuthAlert) => void
}

/** Called with the credentials once the form is valid. `setAlert` reports the outcome to the user. */
export type OnFormSubmitType = (params: OnFormSubmitParams) => void
