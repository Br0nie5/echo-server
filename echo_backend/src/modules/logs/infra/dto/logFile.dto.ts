/** A log file as it is stored, without its content. */
export interface LogFileDto {
  path: string
  /**
   * Short name of the file shown to a user: its name, without its directories nor its extension.
   */
  locationName: string
  /**
   * Name of the group the file belongs to.
   *
   * It is made of the directories between the logs directory and the file, joined by `_`, without
   * the first one nor those named like the `logFilesDirName` the files are read with. It is
   * `undefined` when none is left.
   */
  groupName: string | undefined
}
