import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material'
import { memo } from 'react'

import { useSyncedState } from '../hooks/useSyncedState'

interface CollapsibleBoxProps {
  /** Identifies the box in the page: it links the header to the content it controls. */
  id: string
  /** The header, always displayed: clicking it opens or closes the box. */
  title: React.ReactElement
  /** The content, rendered only while the box is open. */
  children?: React.ReactNode
  /** Whether the box is open at first, and again each time this value changes. */
  isOpenedAtStart: boolean
  /** The CSS width of the box: the one of its container when left out. */
  width?: string
}

const CollapsibleBoxComponent: React.FC<CollapsibleBoxProps> = ({
  id,
  title,
  children,
  isOpenedAtStart,
  width
}) => {
  const [isOpen, setIsOpen] = useSyncedState(isOpenedAtStart)

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

/**
 * A box with a header the user clicks to open or close its content.
 *
 * The content is only rendered while the box is open, so a closed box costs
 * nothing but its header. The box holds its open state itself, starting from
 * `isOpenedAtStart`, and takes that value back each time it changes, whatever
 * the user did in between.
 *
 * ```tsx
 * <CollapsibleBox id="today" title={<Typography>Today</Typography>} isOpenedAtStart>
 *   <LogCard log={log} />
 * </CollapsibleBox>
 * ```
 */
export const CollapsibleBox = memo(CollapsibleBoxComponent)
