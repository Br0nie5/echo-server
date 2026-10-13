import { Box, Typography } from '@mui/material'
import React, { memo, useEffect } from 'react'

import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { useRedirectionOnAuth } from '../hooks/useRedirectionOnAuth'

const RedirectLayoutComponent: React.FC = () => {
  const translation = useAppTranslation()

  const { redirectOnAuth, redirectionUrl } = useRedirectionOnAuth()

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
      <Typography variant="body1" align="center">
        {translation('auth.redirect.message')}
      </Typography>
      <Box sx={{ padding: 1 }} />
      <Typography variant="body1" align="center" sx={{ wordBreak: 'break-all' }}>
        {redirectionUrl}
      </Typography>
    </Box>
  )
}

/**
 * A message redirecting at once, which shows the URL it redirects to, so the user can go there by
 * hand if the browser did not follow.
 */
export const RedirectLayout = memo(RedirectLayoutComponent)
