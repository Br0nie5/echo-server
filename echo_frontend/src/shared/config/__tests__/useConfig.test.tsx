import { Box, Typography } from '@mui/material'
import { render } from '@testing-library/react'

import { ConfigContext } from '../../../initializers/config/ConfigContext'
import { testConfig } from '../../../test/utils/config'
import { useConfig } from '../useConfig'

const TestConfigComponent: React.FC = () => {
  const { SERVER_NAME } = useConfig()

  return (
    <Box>
      <Typography>{`${SERVER_NAME}`}</Typography>
    </Box>
  )
}

describe('useConfig', () => {
  test('Should display the config provided by ConfigContext', () => {
    const component = render(
      <ConfigContext.Provider value={{ config: testConfig }}>
        <TestConfigComponent />
      </ConfigContext.Provider>
    )

    expect(component.getByText(testConfig.SERVER_NAME)).toBeInTheDocument()
  })

  test('Should throw an error if there is no ConfigContext when trying to access the config', () => {
    expect(() => render(<TestConfigComponent />)).toThrow(
      'useConfig must be used within ConfigProvider'
    )
  })
})
