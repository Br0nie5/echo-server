import { Box, Typography } from '@mui/material'
import React, { memo } from 'react'

import { useAppTranslation } from '../i18n/useAppTranslation'

type ErrorLayoutProps = {
  button?: React.ReactElement
}

const ErrorLayoutComponent: React.FC<ErrorLayoutProps> = ({ button }) => {
  const translation = useAppTranslation()

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
      <Typography variant="body1">{translation('query.error')}</Typography>
      {button && (
        <>
          <Box sx={{ padding: 1 }} />
          {button}
        </>
      )}
    </Box>
  )
}

/** Centered error message, with an optional `button` (retry for example). */
export const ErrorLayout = memo(ErrorLayoutComponent)
