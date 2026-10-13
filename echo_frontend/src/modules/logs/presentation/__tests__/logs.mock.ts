import { createLogId, LogLevel, type Log } from '@echo/utilities'

type NoIdLog = Omit<Log, 'id'>
type LogSource = Pick<NoIdLog, 'groupName' | 'location' | 'locationName' | 'origin'>

const sendInvoices: LogSource = {
  groupName: 'billing',
  location: '/storage/billing/send_invoices',
  locationName: 'send_invoices',
  origin: 'send_invoices.sh:12'
}

const syncStock: LogSource = {
  groupName: 'shop',
  location: '/storage/shop/sync_stock',
  locationName: 'sync_stock',
  origin: 'sync_stock.sh:7'
}

const ping: LogSource = {
  location: '/storage/ping',
  locationName: 'ping'
}

const noIdLogs: NoIdLog[] = [
  {
    ...sendInvoices,
    jobId: 12,
    date: '2026-04-28T09:42:09.000Z',
    level: LogLevel.INFO,
    message: 'Invoices sent.'
  },
  {
    ...sendInvoices,
    jobId: 12,
    date: '2026-04-28T09:42:05.000Z',
    level: LogLevel.SUCCESS,
    message: 'Invoice 41 sent on attempt 1.'
  },
  {
    ...syncStock,
    jobId: 7,
    date: '2026-04-28T08:15:30.000Z',
    level: LogLevel.ERROR,
    message: 'Stock could not be read.'
  },
  {
    ...syncStock,
    jobId: 7,
    date: '2026-04-28T08:15:00.000Z',
    level: LogLevel.WARNING,
    message: 'Stock file is older than a day.'
  },
  {
    ...ping,
    jobId: 3,
    date: '2026-04-28T07:00:00.000Z',
    level: LogLevel.INFO,
    message: 'Ping answered.'
  },
  {
    ...sendInvoices,
    jobId: 11,
    date: '2026-04-27T09:40:00.000Z',
    level: LogLevel.INFO,
    message: 'Nothing to send.'
  },
  {
    ...syncStock,
    jobId: 6,
    date: '2026-04-26T08:15:00.000Z',
    level: LogLevel.SUCCESS,
    message: 'Stock synchronized.'
  }
]

/**
 * The logs of three days in a row, from the newest to the oldest, as the API answers them.
 *
 * The newest day, 28 April 2026, has every level, two groups (`billing`, `shop`) and a log without
 * group. The two days before have one log each.
 */
export const logsMock: Log[] = noIdLogs.map((noIdLog, index) => ({
  ...noIdLog,
  id: createLogId(noIdLog, index)
}))
