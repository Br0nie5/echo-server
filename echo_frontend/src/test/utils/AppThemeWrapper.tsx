import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import { theme } from '../../shared/theme'

/**
 * Gives its children the look of the app, as `App` does: its MUI theme, the baseline styles, and
 * the localization of the date pickers.
 */
export const AppThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <LocalizationProvider dateAdapter={AdapterDayjs}>{children}</LocalizationProvider>
  </ThemeProvider>
)
