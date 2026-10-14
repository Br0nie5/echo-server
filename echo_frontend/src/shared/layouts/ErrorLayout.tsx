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
          <Box sx={(theme) => ({ padding: theme.dimensions.errorLayout.buttonGap })} />
          {button}
        </>
      )}
    </Box>
  )
}

/** A centered error message, with an optional `button`, to try again for example. */
export const ErrorLayout = memo(ErrorLayoutComponent)
