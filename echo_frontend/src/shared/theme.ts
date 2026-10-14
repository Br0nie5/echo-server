import type { LogLevel } from '@echo/utilities'
import { createTheme } from '@mui/material'

declare module '@mui/material/styles' {
  /** The colors of the theme, with those of the app. */
  interface Palette {
    /** The background of a log of each level. */
    logLevelBackground: Record<LogLevel, string>
  }

  /** The colors given to `createTheme`, with those of the app. */
  interface PaletteOptions {
    logLevelBackground?: Record<LogLevel, string>
  }
}

const translucentGreen = 'rgba(56, 142, 60, 0.3)'
const translucentBlue = 'rgba(25, 118, 210, 0.3)'
const translucentOrange = 'rgba(245, 124, 0, 0.3)'
const translucentRed = 'rgba(183, 28, 28, 0.3)'

/**
 * The dark theme of the app.
 *
 * Besides the colors of MUI, `palette.logLevelBackground` gives the background of a log of each
 * level, translucent so the text of the cards stays readable on it.
 *
 * ```ts
 * const backgroundColor = theme.palette.logLevelBackground[log.level]
 * ```
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
      main: translucentGreen
    },
    info: {
      main: translucentBlue
    },
    warning: {
      main: translucentOrange
    },
    error: {
      main: translucentRed
    },
    logLevelBackground: {
      SUCCESS: translucentGreen,
      INFO: translucentBlue,
      WARNING: translucentOrange,
      ERROR: translucentRed
    }
  }
})
