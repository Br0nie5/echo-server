import { Box, CircularProgress, useTheme } from '@mui/material'
import React, { memo } from 'react'

const LoadingLayoutComponent: React.FC = () => {
  const theme = useTheme()

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
      <CircularProgress size={theme.dimensions.loadingLayout.spinnerSize} />
    </Box>
  )
}

/** A centered loading spinner. */
export const LoadingLayout = memo(LoadingLayoutComponent)
