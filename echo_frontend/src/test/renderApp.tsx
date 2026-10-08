import type { Config } from '@echo/utilities'
import type { RenderResult } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderComponent } from './renderComponent.tsx'
import { testEnv } from './utils/env.ts'

export const renderApp = async (
  testPath: string,
  child: React.ReactElement,
  pathParams?: string,
  params?: { envOverride?: Config }
): Promise<RenderResult> => {
  const env = params?.envOverride ?? testEnv

  const initialPath = `${new URL(env.APP_URL).pathname}${testPath}`

  const initialPathWithParams = `${initialPath}${pathParams !== undefined ? pathParams : ''}`

  const screen = await renderComponent(
    <MemoryRouter initialEntries={[initialPathWithParams]}>
      <Routes>
        <Route path={initialPath} element={child} />
      </Routes>
    </MemoryRouter>,
    { envOverride: env }
  )

  return screen
}
