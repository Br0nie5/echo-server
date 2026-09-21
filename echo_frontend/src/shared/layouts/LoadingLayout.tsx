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
      <CircularProgress sx={{ color: theme.palette.primary.main }} size="15%" />
    </Box>
  )
}

/** Centered loading spinner. */
export const LoadingLayout = memo(LoadingLayoutComponent)
