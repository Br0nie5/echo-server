import { createLogWithIds, type Log } from '@echo/utilities'

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
const getLogsMockWithoutIds = (date: Date): Array<Omit<Log, 'id' | 'contentId'>> => [
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.465Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:1',
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.453Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:2',
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.443Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:3',
    category: 'SUCCESS',
    message: "Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:42:09.127Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:4',
    category: 'INFO',
    message: 'Starting updated services: echo.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.520Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:5',
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.516Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:6',
    category: 'WARNING',
    message: "Unused docker images couldn't be removed.",
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.495Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:7',
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:58.490Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:8',
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.701Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:9',
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.694Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:10',
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.531Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:11',
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.461Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:12',
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T09:41:53.457Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 66,
    origin: '/server/docker_utils/update_docker_container.sh:13',
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.076Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:14',
    category: 'INFO',
    message: 'Finished check_logs script.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.071Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:15',
    category: 'INFO',
    message:
      'Last logs check time updated to ${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01Z.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.066Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:16',
    category: 'INFO',
    message: 'Updating last logs check time...',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.062Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:17',
    category: 'INFO',
    message: 'No logs to send to Telegram.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.058Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:18',
    category: 'INFO',
    message: 'Preparing Telegram logs message...',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:03.054Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:19',
    category: 'INFO',
    message: 'Logs have been received and formatted.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.478Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:20',
    category: 'INFO',
    message: 'Fetching logs from API...',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.449Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:21',
    category: 'INFO',
    message:
      'Last logs check time is ${formatDateToMock(date, { daysToRemove: 0 })}T13:53:01Z and current time is ${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01Z.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.438Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:22',
    category: 'INFO',
    message: 'Getting logs check times...',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.421Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:23',
    category: 'INFO',
    message: 'Starting check_logs script.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:23:01.416Z`,
    location: '/server/utils/log/check_logs.jsonl',
    locationName: 'check_logs',
    jobId: 3983,
    origin: '/server/utils/check_logs.sh:24',
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T14:13:00.153Z`,
    location: '/server/log/not_an_undefined_filename_though.jsonl',
    locationName: 'not_an_undefined_filename_though',
    jobId: 1,
    origin: '/server/not_an_undefined_filename_though.sh:25',
    category: 'INFO',
    message: 'The only log of an undefined group name...',
    groupName: undefined
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:13:00.153Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:26',
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:13:00.146Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:27',
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:13:00.142Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:28',
    category: 'SUCCESS',
    message: "Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:59.855Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:29',
    category: 'INFO',
    message: 'Starting updated services: echo.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.124Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:30',
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.116Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:31',
    category: 'INFO',
    message: 'Unused docker images are now removed.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.078Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:32',
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:49.071Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:33',
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:44.074Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:34',
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:44.069Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:35',
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:43.915Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:36',
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:43.531Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:37',
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 0 })}T13:12:43.526Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 65,
    origin: '/server/docker_utils/update_docker_container.sh:38',
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:59.756Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:39',
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:59.744Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:40',
    category: 'ERROR',
    message:
      'Unexpected error in \'update_docker_container\'\n  Command   : "${dockerCompose[@]}" pull\n  Exit code : 1\n  Line      : 120\n  Call stack:\n      ↳  main()  @ /scripts/docker/utils/update_docker_container.sh:120',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:58.311Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:41',
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:58.306Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:42',
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:58.152Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:43',
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:57.981Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:44',
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 1 })}T13:53:57.978Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 48,
    origin: '/server/docker_utils/update_docker_container.sh:45',
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.649Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:46',
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.642Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:47',
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.637Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:48',
    category: 'SUCCESS',
    message: "Action 'Apply echo update for active services: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:12.385Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:49',
    category: 'INFO',
    message: 'Starting updated services: echo.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.910Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:50',
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.903Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:51',
    category: 'INFO',
    message: 'Unused docker images are now removed.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.875Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:52',
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.868Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:53',
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.136Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:54',
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:01.131Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:55',
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:00.980Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:56',
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:00.911Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:57',
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:45:00.906Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 47,
    origin: '/server/docker_utils/update_docker_container.sh:58',
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.489Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:59',
    category: 'INFO',
    message: 'Finished update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.478Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:60',
    category: 'INFO',
    message: 'Updates for group echo has been applied.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.471Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:61',
    category: 'SUCCESS',
    message: "Action 'Create stopped services for echo: (echo)' succeeded on attempt 1.",
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.314Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:62',
    category: 'INFO',
    message: 'Recreating previously stopped services (without starting): echo.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.146Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:63',
    category: 'INFO',
    message: 'Applying the updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.141Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:64',
    category: 'INFO',
    message: 'Unused docker images are now removed.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.115Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:65',
    category: 'INFO',
    message: 'Removing unused docker images...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:41.107Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:66',
    category: 'INFO',
    message: 'Group echo latest updates has been pulled.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.345Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:67',
    category: 'INFO',
    message: 'Pulling latest updates for group echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.339Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:68',
    category: 'INFO',
    message: 'Docker services group: echo is valid.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.168Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:69',
    category: 'INFO',
    message: 'Validating docker services group: echo...',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.096Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:70',
    category: 'INFO',
    message: 'Starting update_docker_container script.',
    groupName: 'docker_utils'
  },
  {
    date: `${formatDateToMock(date, { daysToRemove: 2 })}T07:44:37.091Z`,
    location: '/server/docker_utils/log/update_docker_container.jsonl',
    locationName: 'update_docker_container',
    jobId: 46,
    origin: '/server/docker_utils/update_docker_container.sh:71',
    category: 'INFO',
    message: 'Log file has been successfully set up.',
    groupName: 'docker_utils'
  }
]

export const getLogsMock = (date: Date): Log[] =>
  getLogsMockWithoutIds(date).map((log, index) => createLogWithIds(log, index))
