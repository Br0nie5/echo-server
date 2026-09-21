import { Box } from '@mui/material'
import React, { memo } from 'react'

interface PageLayoutProps {
  header?: React.ReactElement
  children?: React.ReactNode
}

const PageLayoutComponent: React.FC<PageLayoutProps> = ({ header, children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        padding: 2
      }}
    >
      {header && (
        <>
          {header}
          <Box sx={{ mt: 1 }} />
        </>
      )}
      {children}
    </Box>
  )
}

/** Full-screen page frame with an optional `header` above the content. */
export const PageLayout = memo(PageLayoutComponent)
