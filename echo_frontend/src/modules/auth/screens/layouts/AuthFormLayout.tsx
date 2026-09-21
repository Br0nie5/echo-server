import { Typography, TextField, Button, Box, CircularProgress, Alert } from '@mui/material'
import type { MutationStatus } from '@tanstack/react-query'
import React, { memo } from 'react'

import { useAuthForm } from '../hooks/useAuthForm'
import type { OnFormSubmitType } from '../utils/types'

type AuthFormLayoutProps = {
  onFormSubmit: OnFormSubmitType
  submitStatus: MutationStatus
  formMode: 'login' | 'signUp'
}

const AuthFormLayoutComponent: React.FC<AuthFormLayoutProps> = ({
  onFormSubmit,
  submitStatus,
  formMode
}) => {
  const { translation, onSubmit, alert, username, setUsername, password, setPassword } =
    useAuthForm(onFormSubmit)

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="body1" align="center" sx={{ mb: 3 }}>
        {translation('auth.form.enterCredentials')}
      </Typography>
      {alert && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      <TextField
        label={translation('auth.form.username')}
        variant="outlined"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={submitStatus === 'pending'}
        autoComplete="username"
      />
      <TextField
        label={translation('auth.form.password')}
        variant="outlined"
        fullWidth
        margin="normal"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitStatus === 'pending'}
        autoComplete={formMode === 'login' ? 'current-password' : 'new-password'}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3 }}
        disabled={submitStatus === 'pending' || submitStatus === 'success'}
        startIcon={submitStatus === 'pending' && <CircularProgress size={20} color="inherit" />}
      >
        {formMode === 'login'
          ? translation('auth.login.button')
          : translation('auth.signUp.button')}
      </Button>
    </Box>
  )
}

/** Credentials form shared by the login and the sign up. `formMode` sets the browser password autocomplete hint. */
export const AuthFormLayout = memo(AuthFormLayoutComponent)
