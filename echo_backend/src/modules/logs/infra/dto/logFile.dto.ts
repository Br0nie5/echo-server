/** A log file as it is stored, without its content. */
export interface LogFileDto {
  path: string
  /** Base name of the file, without its directories nor its extension. */
  fileName: string
  /**
   * Name of the group the file belongs to.
   *
   * It is made of the directories between the logs directory the file was found in and the file, joined by `_`, without
   * the first one nor those named `log`. It is `undefined` when none is left.
   */
  groupName: string | undefined
}
