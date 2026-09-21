import type { Log, LogCategory } from '@echo/utilities'
import { Card, CardContent, Typography, useTheme, type Theme } from '@mui/material'
import React, { memo } from 'react'

import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { formatDate } from '../../../../shared/utils/formatDate'

const getLogCategoryBackgroundColor = (logCategory: LogCategory, theme: Theme): string => {
  switch (logCategory) {
    case 'SUCCESS':
      return theme.palette.success.main
    case 'INFO':
      return theme.palette.info.main
    case 'WARNING':
      return theme.palette.warning.main
    case 'ERROR':
      return theme.palette.error.main
  }
}

interface LogCardProps {
  log: Log
}

const LogCardComponent: React.FC<LogCardProps> = ({ log }) => {
  const theme = useTheme()
  const translation = useAppTranslation()

  const formattedDate = formatDate(
    new Date(log.date),
    'year/month/day - hour:minutes:seconds',
    translation
  )
  const entryLogTitle = `${formattedDate} - ${log.category}`

  return (
    <Card sx={{ marginBottom: 2 }}>
      <CardContent
        sx={{
          backgroundColor: getLogCategoryBackgroundColor(log.category, theme),
          color: theme.palette.text.primary,
          borderRadius: 2,
          padding: 2
        }}
      >
        <Typography variant="body2">{entryLogTitle}</Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 'bold',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {log.message}
        </Typography>
      </CardContent>
    </Card>
  )
}

/** One log: its date and category, colored by category, and its message. */
export const LogCard = memo(LogCardComponent)
