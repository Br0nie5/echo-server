import {
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material'
import React, { memo } from 'react'

import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { useAuthForm } from '../hooks/useAuthForm'
import type { AuthFormMode } from '../utils/authForm'

type AuthFormLayoutProps = {
  formMode: AuthFormMode
}

const AuthFormLayoutComponent: React.FC<AuthFormLayoutProps> = ({ formMode }) => {
  const translation = useAppTranslation()
  const theme = useTheme()
  const {
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
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        maxWidth: theme.dimensions.authForm.maxWidth,
        mx: 'auto',
        p: theme.dimensions.authForm.padding
      }}
    >
      <Typography
        variant="body1"
        align="center"
        sx={{ mb: theme.dimensions.authForm.introBottomMargin }}
      >
        {translation('auth.form.enterCredentials')}
      </Typography>
      {alert && (
        <Alert severity={alert.severity} sx={{ mb: theme.dimensions.authForm.alertBottomMargin }}>
          {translation(alert.messageKey)}
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
        sx={{ mt: theme.dimensions.authForm.buttonTopMargin }}
        disabled={isSubmitting || isAuthenticated}
        startIcon={
          isSubmitting && (
            <CircularProgress size={theme.dimensions.authForm.buttonSpinnerSize} color="inherit" />
          )
        }
      >
        {formMode === 'login'
          ? translation('auth.login.button')
          : translation('auth.signUp.button')}
      </Button>
    </Box>
  )
}

/**
 * The credentials form, of the login or of the sign up of the first account depending on
 * `formMode`.
 */
export const AuthFormLayout = memo(AuthFormLayoutComponent)
