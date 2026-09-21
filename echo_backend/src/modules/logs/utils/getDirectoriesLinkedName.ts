/** Name of the group a log file belongs to: its directories (minus the root and `log`), joined by `_`. */
export const getDirectoriesLinkedName = (filePath: string): string | undefined => {
  const filePathParts = filePath.split('/').filter((part) => part.length !== 0 && part !== 'log')
  // Remove filename part
  filePathParts.pop()
  // Remove first directory part
  filePathParts.shift()

  return filePathParts.length > 0 ? filePathParts.join('_') : undefined
}
