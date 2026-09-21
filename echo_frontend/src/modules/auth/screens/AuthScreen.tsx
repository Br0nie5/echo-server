import { Typography } from '@mui/material'
import React, { memo, useMemo } from 'react'

import { useScreenTitle } from '../../../shared/hooks/useScreenTitle'
import { PageLayout } from '../../../shared/layouts/PageLayout'
import { QueryFallbackLayout } from '../../../shared/layouts/QueryFallbackLayout'

import { useAuthScreen } from './hooks/useAuthScreen'
import { AuthLoginLayout } from './layouts/AuthLoginLayout'
import { AuthSignUpLayout } from './layouts/AuthSignUpLayout'
import { RedirectLayout } from './layouts/RedirectLayout'

const AuthScreenComponent: React.FC = () => {
  const { translation, env, authCheckResult, authCheckResultStatus, refetchAuthResultCheck } =
    useAuthScreen()

  useScreenTitle(translation('auth.wall'))

  const title = useMemo(
    () => (
      <Typography variant="h4" gutterBottom align="center" sx={{ mt: 3 }}>
        {`${env.SERVER_NAME}: ${translation('auth.wall')}`}
      </Typography>
    ),
    [env.SERVER_NAME, translation]
  )

  if (!authCheckResult) {
    return (
      <PageLayout header={title}>
        <QueryFallbackLayout status={authCheckResultStatus} refetch={refetchAuthResultCheck} />
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

  if (authCheckResult === 'signUp') {
    return (
      <PageLayout header={title}>
        <AuthSignUpLayout />
      </PageLayout>
    )
  }

  return (
    <PageLayout header={title}>
      <AuthLoginLayout />
    </PageLayout>
  )
}

/** Auth page: checks the authentication, then shows the login form, the sign up form (no account yet) or redirects (already authenticated). */
export const AuthScreen = memo(AuthScreenComponent)
