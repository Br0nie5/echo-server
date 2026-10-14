/**
 * Thrown by the `FilesService` when it is asked to read a file that does not exist.
 *
 * Whoever reads a file that may be missing catches it to tell that case apart from a file that
 * exists but cannot be read:
 *
 * ```ts
 * try {
 *   return await filesService.getFileLines(filePath)
 * } catch (error) {
 *   if (error instanceof FileDoesNotExistError) {
 *     return []
 *   }
 *   throw error
 * }
 * ```
 */
export class FileDoesNotExistError extends Error {
  constructor(filePath: string) {
    super(`The file ${filePath} does not exist`)
    this.name = 'FileDoesNotExistError'
  }
}
