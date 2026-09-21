import { createTheme } from '@mui/material'

/** Dark theme. The log category colors are translucent so the cards stay readable on it. */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bc0470'
    },
    success: {
      main: 'rgba(56, 142, 60, 0.3)' // Darker muted green with transparency for SUCCESS
    },
    info: {
      main: 'rgba(25, 118, 210, 0.3)' // Darker muted blue with transparency for INFO
    },
    warning: {
      main: 'rgba(245, 124, 0, 0.3)' // Darker muted orange with transparency for WARNING
    },
    error: {
      main: 'rgba(183, 28, 28, 0.3)' // Darker muted red with transparency for ERROR
    }
  }
})
