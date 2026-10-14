import { Box, Typography } from '@mui/material'
import { memo } from 'react'

import { useAppTranslation } from '../i18n/useAppTranslation'

const NoDataLayoutComponent: React.FC = () => {
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
      <Typography variant="body1">{translation('query.noData')}</Typography>
    </Box>
  )
}

/** A centered message saying there is nothing to display. */
export const NoDataLayout = memo(NoDataLayoutComponent)
