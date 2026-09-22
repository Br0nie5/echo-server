import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** ESM has no `__dirname`, so it is rebuilt from the module URL. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Directory holding the backend's persistent data (users database, cron checkpoint, self-logs session), at the repository root. */
export const dataDir = path.join(__dirname, '../../../../data')
