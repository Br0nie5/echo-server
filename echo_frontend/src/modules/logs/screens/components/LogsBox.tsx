import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material'
import { memo, useState } from 'react'

interface LogsBoxProps {
  id: string
  title: React.ReactElement
  children?: React.ReactNode
  isOpenedAtStart: boolean
  width?: string
}

const LogsBoxComponent: React.FC<LogsBoxProps> = ({
  id,
  title,
  children,
  isOpenedAtStart,
  width
}) => {
  const [previousIsOpenedAtStart, setPreviousIsOpenedAtStart] = useState(isOpenedAtStart)
  const [isOpen, setIsOpen] = useState(isOpenedAtStart)

  if (isOpenedAtStart !== previousIsOpenedAtStart) {
    setPreviousIsOpenedAtStart(isOpenedAtStart)
    setIsOpen(isOpenedAtStart)
  }

  return (
    <Box sx={{ width }}>
      <Accordion expanded={isOpen} onChange={() => setIsOpen(!isOpen)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${id}-content`}
          id={`panel-${id}-header`}
          sx={{ height: '80px', width }}
        >
          {title}
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 1 }}>{isOpen && children}</AccordionDetails>
      </Accordion>
    </Box>
  )
}

/** Collapsible box. Its content is only rendered while open, and it follows `isOpenedAtStart` whenever that changes. */
export const LogsBox = memo(LogsBoxComponent)
