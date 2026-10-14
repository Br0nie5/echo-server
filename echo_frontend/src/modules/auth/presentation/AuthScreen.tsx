import { Typography } from '@mui/material'
import React, { memo, useMemo } from 'react'

import { useScreenTitle } from '../../../shared/hooks/useScreenTitle'
import { useAppTranslation } from '../../../shared/i18n/useAppTranslation'
import { PageLayout } from '../../../shared/layouts/PageLayout'
import { QueryFallbackLayout } from '../../../shared/layouts/QueryFallbackLayout'

import { useAuthScreen } from './hooks/useAuthScreen'
import { AuthFormLayout } from './layouts/AuthFormLayout'
import { RedirectLayout } from './layouts/RedirectLayout'

const AuthScreenComponent: React.FC = () => {
  const translation = useAppTranslation()
  const { config, authCheckResult, authCheckStatus, refetchAuthCheck } = useAuthScreen()

  useScreenTitle(translation('auth.title'))

  const title = useMemo(
    () => (
      <Typography variant="h4" gutterBottom align="center" sx={{ mt: 3 }}>
        {`${config.serverName}: ${translation('auth.title')}`}
      </Typography>
    ),
    [config.serverName, translation]
  )

  if (!authCheckResult) {
    return (
      <PageLayout header={title}>
        <QueryFallbackLayout status={authCheckStatus} refetch={refetchAuthCheck} />
      </PageLayout>
    )
  }

  if (authCheckResult === 'redirect') {
    return (
      <PageLayout header={title}>
        <RedirectLayout />
      </PageLayout>
    )
  }

  return (
    <PageLayout header={title}>
      <AuthFormLayout formMode={authCheckResult} />
    </PageLayout>
  )
}

/**
 * The auth screen.
 *
 * It checks the authentication, then displays the login form, the sign up form when no account
 * exists yet, or redirects when the user is already authenticated.
 */
export const AuthScreen = memo(AuthScreenComponent)
