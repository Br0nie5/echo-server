import React, { memo } from 'react'

import { useAuthSignUp } from '../hooks/useAuthSignUp'

import { AuthFormLayout } from './AuthFormLayout'

const AuthSignUpLayoutComponent: React.FC = () => {
  const { signUp, postSignUpMutationStatus } = useAuthSignUp()

  return (
    <AuthFormLayout
      onFormSubmit={signUp}
      submitStatus={postSignUpMutationStatus}
      formMode={'signUp'}
    />
  )
}

/** The credentials form wired to the sign up of the first account. */
export const AuthSignUpLayout = memo(AuthSignUpLayoutComponent)
