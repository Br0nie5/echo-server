import type { Log } from '@echo/utilities'

/**
 * A diagnostic the backend reports about itself, shown in the app like any other log.
 *
 * It is a `Log` without what the storage sets when the self log is saved: its id, its date, its
 * job, and the file and group it is stored in. `callFile` names what the diagnostic is about, such
 * as the log file a line could not be read from, and `callLine` the position it points to inside.
 */
export type SelfLog = Omit<Log, 'id' | 'date' | 'jobId' | 'fileName' | 'groupName'>
