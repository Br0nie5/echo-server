import i18n from '../../shared/i18n/i18n'
import type { AppTranslation } from '../../shared/i18n/useAppTranslation'

/**
 * Translates a key the way the app does, for a test to find a text the app displays.
 *
 * ```ts
 * expect(screen.getByText(appTranslation('query.noData'))).toBeInTheDocument()
 * ```
 */
export const appTranslation: AppTranslation = (key) => i18n.t(key)
