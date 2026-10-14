import { createTheme } from '@mui/material'

/**
 * The dark theme of the app.
 *
 * The colors of the log levels are translucent, so the cards stay readable on it.
 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bc0470'
    },
    secondary: {
      main: '#ce93d8'
    },
    success: {
      main: 'rgba(56, 142, 60, 0.3)'
    },
    info: {
      main: 'rgba(25, 118, 210, 0.3)'
    },
    warning: {
      main: 'rgba(245, 124, 0, 0.3)'
    },
    error: {
      main: 'rgba(183, 28, 28, 0.3)'
    }
  }
})
