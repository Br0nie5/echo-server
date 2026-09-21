import { Box, Button, Typography } from '@mui/material'
import type { QueryStatus } from '@tanstack/react-query'
import { memo } from 'react'

import { useAppTranslation } from '../i18n/useAppTranslation'

import { ErrorLayout } from './ErrorLayout'
import { LoadingLayout } from './LoadingLayout'

type QueryFallbackLayoutProps = {
  status: QueryStatus
  refetch: () => void
}

const QueryFallbackLayoutComponent: React.FC<QueryFallbackLayoutProps> = ({ status, refetch }) => {
  const translation = useAppTranslation()

  if (status === 'pending') {
    return <LoadingLayout />
  } else if (status === 'success') {
    return (
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <Typography variant="body1">{translation('query.noData')}</Typography>
      </Box>
    )
  }

  return (
    <ErrorLayout
      button={
        <Button variant="contained" onClick={refetch}>
          <Typography variant="body1">{translation('query.refetchButton')}</Typography>
        </Button>
      }
    />
  )
}

/** What to show instead of the data of a query: a spinner while pending, a no-data message once successful, an error with a refetch button otherwise. */
export const QueryFallbackLayout = memo(QueryFallbackLayoutComponent)
