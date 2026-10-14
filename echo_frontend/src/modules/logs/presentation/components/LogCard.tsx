import type { Log } from '@echo/utilities'
import { Card, CardContent, Typography, useTheme } from '@mui/material'
import React, { memo } from 'react'

import { formatDateTime } from '../../../../shared/utils/formatDates'

interface LogCardProps {
  log: Log
}

const LogCardComponent: React.FC<LogCardProps> = ({ log }) => {
  const theme = useTheme()

  const formattedDate = formatDateTime(new Date(log.date))
  const entryLogTitle = `${formattedDate} - ${log.level}`

  return (
    <Card sx={{ marginBottom: theme.dimensions.logs.cardGap }}>
      <CardContent
        sx={{
          backgroundColor: theme.palette.logLevelBackground[log.level],
          color: theme.palette.text.primary,
          borderRadius: theme.shape.logCardRadius,
          padding: theme.dimensions.logs.cardPadding
        }}
      >
        <Typography variant="body2">{entryLogTitle}</Typography>
        <Typography variant="logMessage">{log.message}</Typography>
      </CardContent>
    </Card>
  )
}

/** One log: its date, its level and its message, colored by level. */
export const LogCard = memo(LogCardComponent)
