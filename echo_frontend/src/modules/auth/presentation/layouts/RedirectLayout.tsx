import { Box, Button, Typography } from '@mui/material'
import React, { memo, useEffect } from 'react'

import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { useRedirectionOnAuth } from '../hooks/useRedirectionOnAuth'

const RedirectLayoutComponent: React.FC = () => {
  const translation = useAppTranslation()

  const { redirectOnAuth } = useRedirectionOnAuth()

  useEffect(() => {
    redirectOnAuth()
  }, [redirectOnAuth])

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <Typography variant="body1">{translation('auth.redirect.message')}</Typography>
      <Box sx={{ padding: 1 }} />
      <Button variant="contained" onClick={redirectOnAuth}>
        <Typography variant="body1">{translation('auth.redirect.button')}</Typography>
      </Button>
    </Box>
  )
}

/** Redirects at once, with a button to retry if the browser did not follow. */
export const RedirectLayout = memo(RedirectLayoutComponent)
