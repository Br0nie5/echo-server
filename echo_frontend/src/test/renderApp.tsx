import type { EchoEnv } from '@echo/utilities'
import type { RenderResult } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderComponent } from './renderComponent.tsx'
import { testEnv } from './utils/env.ts'

export const renderApp = async (
  testPath: string,
  child: React.ReactElement,
  pathParams?: string,
  params?: { envOverride?: EchoEnv }
): Promise<RenderResult> => {
  const echoEnv = params?.envOverride ?? testEnv

  const initialPath = `${new URL(echoEnv.APP_URL).pathname}${testPath}`

  const initialPathWithParams = `${initialPath}${pathParams !== undefined ? pathParams : ''}`

  const screen = await renderComponent(
    <MemoryRouter initialEntries={[initialPathWithParams]}>
      <Routes>
        <Route path={initialPath} element={child} />
      </Routes>
    </MemoryRouter>,
    { envOverride: echoEnv }
  )

  return screen
}
