import type { LogLevel } from '@echo/utilities'
import { createTheme } from '@mui/material'
import type { CSSProperties } from 'react'

/**
 * The spacing and the sizes of the app, grouped by the place that uses them.
 *
 * A number is a number of MUI spacing units for a margin, a padding or a gap, and of pixels for a
 * size; a string is any CSS length.
 */
interface Dimensions {
  page: { padding: number; headerGap: number }
  screenTitle: { topMargin: number }
  errorLayout: { buttonGap: number }
  loadingLayout: { spinnerSize: string }
  collapsibleBox: { headerHeight: string; contentPadding: number }
  searchBar: { portraitGap: number; landscapeGap: number; buttonTopMargin: number }
  filterChips: { gap: number; bottomMargin: number }
  authForm: {
    maxWidth: number
    padding: number
    introBottomMargin: number
    alertBottomMargin: number
    buttonTopMargin: number
    buttonSpinnerSize: number
  }
  redirectLayout: { urlGap: number }
  logsFilters: {
    portraitGap: number
    landscapeGap: number
    padding: number
    levelsBottomMargin: number
    levelsTitleBottomMargin: number
  }
  logs: {
    progressBarGap: string
    daysGap: number
    groupsGap: number
    /** The width of a group next to the others, as a share of the width of the window. */
    groupWidthShareOfWindow: number
    jobsGap: number
    jobPadding: number
    jobBorderWidth: string
    cardGap: number
    cardPadding: number
  }
}

declare module '@mui/material/styles' {
  /** The theme, with the roles of the app. */
  interface Theme {
    /** The spacing and the sizes of the app, grouped by the place that uses them. */
    dimensions: Dimensions
  }

  /** What `createTheme` is given, with the roles of the app. */
  interface ThemeOptions {
    dimensions?: Dimensions
  }

  /** The colors of the theme, with those of the app. */
  interface Palette {
    /** The background of a log of each level. */
    logLevelBackground: Record<LogLevel, string>
    /** The border of the box of a job. */
    logJobBorder: string
  }

  /** The colors given to `createTheme`, with those of the app. */
  interface PaletteOptions {
    logLevelBackground?: Record<LogLevel, string>
    logJobBorder?: string
  }

  /** The text styles of the theme, with those of the app. */
  interface TypographyVariants {
    /** The title of the box of a job. */
    logJobTitle: CSSProperties
    /** The message of a log. */
    logMessage: CSSProperties
  }

  /** The text styles given to `createTheme`, with those of the app. */
  interface TypographyVariantsOptions {
    logJobTitle?: CSSProperties
    logMessage?: CSSProperties
  }
}

declare module '@mui/material/Typography' {
  /** The text styles of the app a `Typography` can use as its `variant`. */
  interface TypographyPropsVariantOverrides {
    logJobTitle: true
    logMessage: true
  }
}

declare module '@mui/system' {
  /** The shapes of the theme, with those of the app, as `sx` multipliers of `borderRadius`. */
  interface Shape {
    /** The corners of a log. */
    logCardRadius: number
    /** The corners of the box of a job. */
    logJobRadius: number
  }
}

const lilac = '#ce93d8'
const translucentGreen = 'rgba(56, 142, 60, 0.3)'
const translucentBlue = 'rgba(25, 118, 210, 0.3)'
const translucentOrange = 'rgba(245, 124, 0, 0.3)'
const translucentRed = 'rgba(183, 28, 28, 0.3)'

const baseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bc0470'
    },
    secondary: {
      main: lilac
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
    },
    logJobBorder: lilac
  },
  shape: {
    logCardRadius: 2,
    logJobRadius: 4
  },
  dimensions: {
    page: { padding: 2, headerGap: 1 },
    screenTitle: { topMargin: 3 },
    errorLayout: { buttonGap: 1 },
    loadingLayout: { spinnerSize: '15%' },
    collapsibleBox: { headerHeight: '80px', contentPadding: 1 },
    searchBar: { portraitGap: 2, landscapeGap: 7, buttonTopMargin: 1 },
    filterChips: { gap: 1, bottomMargin: 3 },
    authForm: {
      maxWidth: 400,
      padding: 3,
      introBottomMargin: 3,
      alertBottomMargin: 2,
      buttonTopMargin: 3,
      buttonSpinnerSize: 20
    },
    redirectLayout: { urlGap: 1 },
    logsFilters: {
      portraitGap: 2,
      landscapeGap: 7,
      padding: 2,
      levelsBottomMargin: 3,
      levelsTitleBottomMargin: 3
    },
    logs: {
      progressBarGap: '5px',
      daysGap: 2,
      groupsGap: 1,
      groupWidthShareOfWindow: 0.4,
      jobsGap: 2,
      jobPadding: 1,
      jobBorderWidth: '1px',
      cardGap: 2,
      cardPadding: 2
    }
  }
})

/**
 * The dark theme of the app.
 *
 * The way a Flutter theme does, every color, text style, spacing and shape a screen uses comes
 * from a role of the theme named after where it is used, even when two roles share a value:
 *
 * - `palette`: the colors of MUI, and those of the app (`logLevelBackground[level]`,
 *   `logJobBorder`). The colors of the log levels are translucent, so the text of the cards stays
 *   readable on them.
 * - `typography`: the text styles of MUI (`h4`, `body1`…), and those of the app (`logJobTitle`,
 *   `logMessage`).
 * - `shape`: the corners, as `sx` multipliers of `borderRadius` (`logCardRadius`, `logJobRadius`).
 * - `dimensions`: the spacing and the sizes, grouped by the place that uses them.
 *
 * ```tsx
 * const theme = useTheme()
 *
 * <Card sx={{ mb: theme.dimensions.logs.cardGap }}>
 *   <Typography variant="logMessage">{log.message}</Typography>
 * </Card>
 * ```
 */
export const theme = createTheme(baseTheme, {
  typography: {
    logJobTitle: { ...baseTheme.typography.body1, fontWeight: 'bold' },
    logMessage: {
      ...baseTheme.typography.body1,
      fontWeight: 'bold',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: { logJobTitle: 'p', logMessage: 'p' }
      }
    }
  }
})
