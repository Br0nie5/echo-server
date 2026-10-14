import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material'
import { memo, useId } from 'react'

import { useSyncedState } from '../hooks/useSyncedState'

interface CollapsibleBoxProps {
  /** The header, always displayed: clicking it opens or closes the box. */
  title: React.ReactElement
  /** The content, rendered only while the box is open. */
  children?: React.ReactNode
  /**
   * Whether the parent wants the box open: it is at first, and again each time this value changes.
   */
  isOpenedByParent: boolean
  /** The CSS width of the box: the one of its container when left out. */
  width?: string
}

const CollapsibleBoxComponent: React.FC<CollapsibleBoxProps> = ({
  title,
  children,
  isOpenedByParent,
  width
}) => {
  const [isOpen, setIsOpen] = useSyncedState(isOpenedByParent)
  const id = useId()

  return (
    <Box sx={{ width }}>
      <Accordion expanded={isOpen} onChange={() => setIsOpen(!isOpen)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`${id}-content`}
          id={`${id}-header`}
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
 * `isOpenedByParent`, and takes that value back each time it changes, whatever
 * the user did in between.
 *
 * ```tsx
 * <CollapsibleBox title={<Typography>Today</Typography>} isOpenedByParent>
 *   <LogCard log={log} />
 * </CollapsibleBox>
 * ```
 */
export const CollapsibleBox = memo(CollapsibleBoxComponent)
