import React, { memo } from 'react'

import { useAuthLogin } from '../hooks/useAuthLogin'

import { AuthFormLayout } from './AuthFormLayout'

const AuthLoginLayoutComponent: React.FC = () => {
  const { login, postLoginMutationStatus } = useAuthLogin()

  return (
    <AuthFormLayout
      onFormSubmit={login}
      submitStatus={postLoginMutationStatus}
      formMode={'login'}
    />
  )
}

/** The credentials form wired to the login. */
export const AuthLoginLayout = memo(AuthLoginLayoutComponent)
