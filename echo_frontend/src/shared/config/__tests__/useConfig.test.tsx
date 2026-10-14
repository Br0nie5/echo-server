import { Box, Typography } from '@mui/material'
import { render } from '@testing-library/react'

import { mockConfig } from '../../../test/mocks/mockConfig'
import { ConfigContext } from '../ConfigContext'
import { useConfig } from '../useConfig'

const TestConfigComponent: React.FC = () => {
  const { serverName } = useConfig()

  return (
    <Box>
      <Typography>{`${serverName}`}</Typography>
    </Box>
  )
}

describe('useConfig', () => {
  test('Should display the config provided by ConfigContext', () => {
    const component = render(
      <ConfigContext.Provider value={{ config: mockConfig }}>
        <TestConfigComponent />
      </ConfigContext.Provider>
    )

    expect(component.getByText(mockConfig.serverName)).toBeInTheDocument()
  })

  test('Should throw an error if there is no ConfigContext when trying to access the config', () => {
    expect(() => render(<TestConfigComponent />)).toThrow(
      'useConfig must be used within ConfigProvider'
    )
  })
})
