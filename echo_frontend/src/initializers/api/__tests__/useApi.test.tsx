import { Box, Typography } from '@mui/material'
import { render } from '@testing-library/react'
import axios from 'axios'

import { ApiContext } from '../ApiContext'
import { useApi } from '../useApi'

const TestApiComponent: React.FC = () => {
  useApi()

  return (
    <Box>
      <Typography>{'api is loaded'}</Typography>
    </Box>
  )
}

describe('useApi', () => {
  test('Should display api is loaded if api is provided by ApiContext', () => {
    const component = render(
      <ApiContext.Provider value={{ axiosInstance: axios.create() }}>
        <TestApiComponent />
      </ApiContext.Provider>
    )

    expect(component.getByText('api is loaded')).toBeInTheDocument()
  })

  test('Should throw an error if there is no ApiContext when trying to access the api', () => {
    expect(() => render(<TestApiComponent />)).toThrow('useApi must be used within ApiProvider')
  })
})
