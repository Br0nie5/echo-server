import { parseAppUrls } from '../parseAppUrls'

describe('parseAppUrls', () => {
  test('Should put the app at the base of the page and the API next to it', () => {
    expect(parseAppUrls('http://localhost:5173/app/')).toStrictEqual({
      APP_URL: 'http://localhost:5173/app',
      API_URL: 'http://localhost:5173/api'
    })
  })

  test('Should keep the path a reverse proxy serves Echo under', () => {
    expect(parseAppUrls('https://example.com/tools/echo/app/')).toStrictEqual({
      APP_URL: 'https://example.com/tools/echo/app',
      API_URL: 'https://example.com/tools/echo/api'
    })
  })
})
