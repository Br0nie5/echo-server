import { useTranslation } from 'react-i18next'

import type { TranslationKeys } from './locales/types'

type DotPrefix<T extends string> = T extends '' ? '' : `${T}.`

/** Dot-separated paths to the leaves of an object type (`{ a: { b: string } }` gives `a.b`). */
type FlattenKeys<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? FlattenKeys<T[K], `${DotPrefix<P>}${K}`>
    : `${DotPrefix<P>}${K}`
}[keyof T & string]

type TranslationKeyPaths = FlattenKeys<TranslationKeys>

/** Translates a key, which is type-checked against the locale keys. */
export type AppTranslation = (key: TranslationKeyPaths) => string

/** Type-safe `t` function: an unknown translation key is a compile error. */
export const useAppTranslation = (): AppTranslation => {
  const { t: tRaw } = useTranslation()
  return (key: TranslationKeyPaths) => tRaw(key)
}
