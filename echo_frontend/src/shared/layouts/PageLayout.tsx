import { Box } from '@mui/material'
import React, { memo } from 'react'

interface PageLayoutProps {
  header?: React.ReactElement
  children?: React.ReactNode
}

const PageLayoutComponent: React.FC<PageLayoutProps> = ({ header, children }) => {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        padding: theme.dimensions.page.padding
      })}
    >
      {header && (
        <>
          {header}
          <Box sx={(theme) => ({ mt: theme.dimensions.page.headerGap })} />
        </>
      )}
      {children}
    </Box>
  )
}

/** The frame of a page, as large as the screen, with an optional `header` above its content. */
export const PageLayout = memo(PageLayoutComponent)
