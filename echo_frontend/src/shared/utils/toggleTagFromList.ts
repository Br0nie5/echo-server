/** Removes the tag from the list if present, appends it otherwise. Does not mutate the list. */
export const toggleTagFromList = <TTag extends string>(
  previousTags: TTag[],
  tagToToggle: TTag
): TTag[] => {
  if (previousTags.includes(tagToToggle)) {
    return previousTags.filter((tag) => tag != tagToToggle)
  }
  return [...previousTags, tagToToggle]
}
