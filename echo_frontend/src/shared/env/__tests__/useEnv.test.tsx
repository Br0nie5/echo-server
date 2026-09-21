import { Box, Typography } from '@mui/material'
import { render } from '@testing-library/react'

import { EnvContext } from '../../../initializers/env/EnvContext'
import { testEnv } from '../../../test/utils/env'
import { useEnv } from '../useEnv'

const TestEnvComponent: React.FC = () => {
  const { SERVER_NAME } = useEnv()

  return (
    <Box>
      <Typography>{`${SERVER_NAME}`}</Typography>
    </Box>
  )
}

describe('useEnv', () => {
  test('Should display the env provided by EnvContext', () => {
    const component = render(
      <EnvContext.Provider value={{ env: testEnv }}>
        <TestEnvComponent />
      </EnvContext.Provider>
    )

    expect(component.getByText(testEnv.SERVER_NAME)).toBeInTheDocument()
  })

  test('Should throw an error if there is no EnvContext when trying to access the env', () => {
    expect(() => render(<TestEnvComponent />)).toThrow('useEnv must be used within EnvProvider')
  })
})
