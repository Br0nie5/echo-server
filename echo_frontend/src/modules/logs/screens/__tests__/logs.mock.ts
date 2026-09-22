/* eslint-disable max-len */
import type { Log } from '@echo/utilities'

const formatDateToMock = (date: Date, { daysToRemove = 0 }: { daysToRemove?: number }): string => {
  const logDate = new Date(date.getTime() - daysToRemove * 24 * 60 * 60 * 1000)

  const formattedLogDate =
    logDate.getFullYear() +
    '-' +
    String(logDate.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(logDate.getDate()).padStart(2, '0')

  return formattedLogDate
}
export const getLogsMock = (date: Date): Log[] => [
  {
    id: `489 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:42:09.465] [INFO] Finished update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.465Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 1,
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `488 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:42:09.453] [INFO] Updates for group echo has been applied.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.453Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 2,
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    id: "487 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:42:09.443] [SUCCESS] Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.443Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 3,
    category: 'SUCCESS',
    message: "Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    id: `486 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:42:09.127] [INFO] Starting updated services: echo.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.127Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 4,
    category: 'INFO',
    message: 'Starting updated services: echo.',
    groupName: 'docker_utils'
  },
  {
    id: `485 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:58.520] [INFO] Applying the updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.520Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 5,
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `484 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:58.516] [INFO] Unused docker images are now removed.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.516Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 6,
    category: 'WARNING',
    message: "Unused docker images couldn't be removed.",
    groupName: 'docker_utils'
  },
  {
    id: `483 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:58.495] [INFO] Removing unused docker images...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.495Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 7,
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    id: `482 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:58.490] [INFO] Group echo latest updates has been pulled.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.490Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 8,
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    id: `481 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:53.701] [INFO] Pulling latest updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.701Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 9,
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `480 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:53.694] [INFO] Docker services group: echo is valid.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.694Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 10,
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    id: `479 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:53.531] [INFO] Validating docker services group: echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.531Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 11,
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    id: `478 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:53.461] [INFO] Starting update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.461Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 12,
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `477 [docker_utils] [update_docker_container] [66] [${formatDateToMock(date, { daysToRemove: 0 })} 11:41:53.457] [INFO] Log file has been successfully set up.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.457Z`,
    fileName: 'update_docker_container',
    jobId: 66,
    callFile: 'update_docker_container.jsonl',
    callLine: 13,
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    id: `3678 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:03.076] [INFO] Finished check_logs script.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.076Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 14,
    category: 'INFO',
    message: 'Finished check_logs script.',
    groupName: 'utils'
  },
  {
    id: `3677 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:03.071] [INFO] Last logs check time updated to ${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01Z.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.071Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 15,
    category: 'INFO',
    message:
      'Last logs check time updated to ${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01Z.',
    groupName: 'utils'
  },
  {
    id: `3676 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:03.066] [INFO] Updating last logs check time...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.066Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 16,
    category: 'INFO',
    message: 'Updating last logs check time...',
    groupName: 'utils'
  },
  {
    id: `3675 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:03.062] [INFO] No logs to send to Telegram.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.062Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 17,
    category: 'INFO',
    message: 'No logs to send to Telegram.',
    groupName: 'utils'
  },
  {
    id: `3674 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:03.058] [INFO] Preparing Telegram logs message...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.058Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 18,
    category: 'INFO',
    message: 'Preparing Telegram logs message...',
    groupName: 'utils'
  },
  {
    id: `3673 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:03.054] [INFO] Logs have been received and formatted.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.054Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 19,
    category: 'INFO',
    message: 'Logs have been received and formatted.',
    groupName: 'utils'
  },
  {
    id: `3672 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:01.478] [INFO] Fetching logs from API...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.478Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 20,
    category: 'INFO',
    message: 'Fetching logs from API...',
    groupName: 'utils'
  },
  {
    id: `3671 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:01.449] [INFO] Last logs check time is ${formatDateToMock(date, { daysToRemove: 0 })}T13:53:01Z and current time is ${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01Z.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.449Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 21,
    category: 'INFO',
    message:
      'Last logs check time is ${formatDateToMock(date, { daysToRemove: 0 })}T13:53:01Z and current time is ${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01Z.',
    groupName: 'utils'
  },
  {
    id: `3670 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:01.438] [INFO] Getting logs check times...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.438Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 22,
    category: 'INFO',
    message: 'Getting logs check times...',
    groupName: 'utils'
  },
  {
    id: `3669 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:01.421] [INFO] Starting check_logs script.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.421Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 23,
    category: 'INFO',
    message: 'Starting check_logs script.',
    groupName: 'utils'
  },
  {
    id: `3668 [utils] [check_logs] [3983] [${formatDateToMock(date, { daysToRemove: 0 })} 16:23:01.416] [INFO] Log file has been successfully set up.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.416Z`,
    fileName: 'check_logs',
    jobId: 3983,
    callFile: 'check_logs.jsonl',
    callLine: 24,
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'utils'
  },
  {
    id: `1 [undefined] [not_an_undefined_filename_though] [1] [${formatDateToMock(date, { daysToRemove: 0 })} 15:13:00.153] [INFO] The only log of an undefined group name...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:13:00.153Z`,
    fileName: 'not_an_undefined_filename_though',
    jobId: 1,
    callFile: 'not_an_undefined_filename_though.jsonl',
    callLine: 25,
    category: 'INFO',
    message: 'The only log of an undefined group name...',
    groupName: undefined
  },
  {
    id: `476 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:13:00.153] [INFO] Finished update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:13:00.153Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 26,
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `475 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:13:00.146] [INFO] Updates for group echo has been applied.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:13:00.146Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 27,
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    id: "474 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:13:00.142] [SUCCESS] Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:13:00.142Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 28,
    category: 'SUCCESS',
    message: "Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    id: `473 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:59.855] [INFO] Starting updated services: echo.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:59.855Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 29,
    category: 'INFO',
    message: 'Starting updated services: echo.',
    groupName: 'docker_utils'
  },
  {
    id: `472 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:49.124] [INFO] Applying the updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.124Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 30,
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `471 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:49.116] [INFO] Unused docker images are now removed.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.116Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 31,
    category: 'INFO',
    message: 'Unused docker images are now removed.',
    groupName: 'docker_utils'
  },
  {
    id: `470 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:49.078] [INFO] Removing unused docker images...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.078Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 32,
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    id: `469 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:49.071] [INFO] Group echo latest updates has been pulled.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.071Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 33,
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    id: `468 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:44.074] [INFO] Pulling latest updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:44.074Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 34,
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `467 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:44.069] [INFO] Docker services group: echo is valid.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:44.069Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 35,
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    id: `466 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:43.915] [INFO] Validating docker services group: echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:43.915Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 36,
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    id: `465 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:43.531] [INFO] Starting update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:43.531Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 37,
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `464 [docker_utils] [update_docker_container] [65] [${formatDateToMock(date, { daysToRemove: 0 })} 15:12:43.526] [INFO] Log file has been successfully set up.`,
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:43.526Z`,
    fileName: 'update_docker_container',
    jobId: 65,
    callFile: 'update_docker_container.jsonl',
    callLine: 38,
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    id: `255 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:59.756] [INFO] Finished update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:59.756Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 39,
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `254 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:59.744] [ERROR] Unexpected error in 'update_docker_container'\\n  Command   : "\${dockerCompose[@]}" pull\\n  Exit code : 1\\n  Line      : 120\\n  Call stack:\\n      ↳  main()  @ /scripts/docker/utils/update_docker_container.sh:120`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:59.744Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 40,
    category: 'ERROR',
    message:
      'Unexpected error in \'update_docker_container\'\n  Command   : "${dockerCompose[@]}" pull\n  Exit code : 1\n  Line      : 120\n  Call stack:\n      ↳  main()  @ /scripts/docker/utils/update_docker_container.sh:120',
    groupName: 'docker_utils'
  },
  {
    id: `253 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:58.311] [INFO] Pulling latest updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:58.311Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 41,
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `252 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:58.306] [INFO] Docker services group: echo is valid.`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:58.306Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 42,
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    id: `251 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:58.152] [INFO] Validating docker services group: echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:58.152Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 43,
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    id: `250 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:57.981] [INFO] Starting update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:57.981Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 44,
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `249 [docker_utils] [update_docker_container] [48] [${formatDateToMock(date, { daysToRemove: 1 })} 15:53:57.978] [INFO] Log file has been successfully set up.`,
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:57.978Z`,
    fileName: 'update_docker_container',
    jobId: 48,
    callFile: 'update_docker_container.jsonl',
    callLine: 45,
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    id: `248 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:12.649] [INFO] Finished update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.649Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 46,
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `247 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:12.642] [INFO] Updates for group echo has been applied.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.642Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 47,
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    id: "246 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:12.637] [SUCCESS] Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.637Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 48,
    category: 'SUCCESS',
    message: "Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    id: `245 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:12.385] [INFO] Starting updated services: echo.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.385Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 49,
    category: 'INFO',
    message: 'Starting updated services: echo.',
    groupName: 'docker_utils'
  },
  {
    id: `244 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:01.910] [INFO] Applying the updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.910Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 50,
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `243 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:01.903] [INFO] Unused docker images are now removed.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.903Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 51,
    category: 'INFO',
    message: 'Unused docker images are now removed.',
    groupName: 'docker_utils'
  },
  {
    id: `242 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:01.875] [INFO] Removing unused docker images...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.875Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 52,
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    id: `241 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:01.868] [INFO] Group echo latest updates has been pulled.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.868Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 53,
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    id: `240 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:01.136] [INFO] Pulling latest updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.136Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 54,
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `239 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:01.131] [INFO] Docker services group: echo is valid.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.131Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 55,
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    id: `238 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:00.980] [INFO] Validating docker services group: echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:00.980Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 56,
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    id: `237 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:00.911] [INFO] Starting update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:00.911Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 57,
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `236 [docker_utils] [update_docker_container] [47] [${formatDateToMock(date, { daysToRemove: 2 })} 09:45:00.906] [INFO] Log file has been successfully set up.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:00.906Z`,
    fileName: 'update_docker_container',
    jobId: 47,
    callFile: 'update_docker_container.jsonl',
    callLine: 58,
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    id: `235 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.489] [INFO] Finished update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.489Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 59,
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `234 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.478] [INFO] Updates for group echo has been applied.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.478Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 60,
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    id: "233 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.471] [SUCCESS] Action 'Create stopped services for echo: (echo)' succeeded on attempt 1.",
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.471Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 61,
    category: 'SUCCESS',
    message: "Action 'Create stopped services for echo: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    id: `232 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.314] [INFO] Recreating previously stopped services (without starting): echo.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.314Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 62,
    category: 'INFO',
    message: 'Recreating previously stopped services (without starting): echo.',
    groupName: 'docker_utils'
  },
  {
    id: `231 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.146] [INFO] Applying the updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.146Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 63,
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `230 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.141] [INFO] Unused docker images are now removed.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.141Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 64,
    category: 'INFO',
    message: 'Unused docker images are now removed.',
    groupName: 'docker_utils'
  },
  {
    id: `229 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.115] [INFO] Removing unused docker images...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.115Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 65,
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    id: `228 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:41.107] [INFO] Group echo latest updates has been pulled.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.107Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 66,
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    id: `227 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:37.345] [INFO] Pulling latest updates for group echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.345Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 67,
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    id: `226 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:37.339] [INFO] Docker services group: echo is valid.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.339Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 68,
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    id: `225 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:37.168] [INFO] Validating docker services group: echo...`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.168Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 69,
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    id: `224 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:37.096] [INFO] Starting update_docker_container script.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.096Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 70,
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    id: `223 [docker_utils] [update_docker_container] [46] [${formatDateToMock(date, { daysToRemove: 2 })} 09:44:37.091] [INFO] Log file has been successfully set up.`,
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.091Z`,
    fileName: 'update_docker_container',
    jobId: 46,
    callFile: 'update_docker_container.jsonl',
    callLine: 71,
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  }
]
