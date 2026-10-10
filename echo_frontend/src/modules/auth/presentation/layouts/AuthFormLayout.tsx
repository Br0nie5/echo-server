import { Typography, TextField, Button, Box, CircularProgress, Alert } from '@mui/material'
import React, { memo } from 'react'

import { useAuthForm } from '../hooks/useAuthForm'
import type { AuthenticationMode } from '../utils/types'

type AuthFormLayoutProps = {
  formMode: AuthenticationMode
}

const AuthFormLayoutComponent: React.FC<AuthFormLayoutProps> = ({ formMode }) => {
  const {
    translation,
    onSubmit,
    isSubmitting,
    isAuthenticated,
    alert,
    username,
    setUsername,
    password,
    setPassword
  } = useAuthForm(formMode)

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
        onChange={(event) => setUsername(event.target.value)}
        disabled={isSubmitting}
        autoComplete="username"
      />
      <TextField
        label={translation('auth.form.password')}
        variant="outlined"
        fullWidth
        margin="normal"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={isSubmitting}
        autoComplete={formMode === 'login' ? 'current-password' : 'new-password'}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3 }}
        disabled={isSubmitting || isAuthenticated}
        startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
      >
        {formMode === 'login'
          ? translation('auth.login.button')
          : translation('auth.signUp.button')}
      </Button>
    </Box>
  )
}

/** Credentials form of the login or of the sign up of the first account, depending on `formMode`. */
export const AuthFormLayout = memo(AuthFormLayoutComponent)
