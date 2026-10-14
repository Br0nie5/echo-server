/**
 * Gives `previousTags` without `tagToToggle` when it holds it, with `tagToToggle` at its end
 * otherwise.
 *
 * `previousTags` is left as it is.
 *
 * ```ts
 * toggleTagFromList(['red', 'blue'], 'blue') // ['red']
 * toggleTagFromList(['red'], 'blue') // ['red', 'blue']
 * ```
 */
export const toggleTagFromList = <TTag extends string>(
  previousTags: TTag[],
  tagToToggle: TTag
): TTag[] => {
  if (previousTags.includes(tagToToggle)) {
    return previousTags.filter((tag) => tag !== tagToToggle)
  }
  return [...previousTags, tagToToggle]
}
