import type { Config } from '@echo/utilities'
import type { RenderResult } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderComponent } from './renderComponent.tsx'
import { testConfig } from './utils/config.ts'

export const renderApp = async (
  testPath: string,
  child: React.ReactElement,
  pathParams?: string,
  params?: { configOverride?: Config }
): Promise<RenderResult> => {
  const config = params?.configOverride ?? testConfig

  const initialPath = `${new URL(config.APP_URL).pathname}${testPath}`

  const initialPathWithParams = `${initialPath}${pathParams !== undefined ? pathParams : ''}`

  const screen = await renderComponent(
    <MemoryRouter initialEntries={[initialPathWithParams]}>
      <Routes>
        <Route path={initialPath} element={child} />
      </Routes>
    </MemoryRouter>,
    { configOverride: config }
  )

  return screen
}
