import { buildMockConfig, mockAppUrls, mockRawConfig } from '../../../../test/mocks/mockConfig'
import { parseFrontConfig } from '../parseFrontConfig'

const BASE_URI = `${mockAppUrls.appUrl}/`

const rawConfig = {
  SERVER_NAME: mockRawConfig.SERVER_NAME,
  HAS_AUTHENTICATION: 'true',
  LOGS_INITIAL_DATE_DAYS_AGO: '2',
  LOGS_MINIMAL_DATE_DAYS_AGO: '14'
}

const NOW = new Date(2026, 3, 28, 10, 0, 0)
const config = buildMockConfig(NOW)

describe('parseFrontConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Should parse a fully provided config', () => {
    expect(parseFrontConfig(rawConfig, BASE_URI)).toStrictEqual(config)
  })

  test('Should read where the app and the API are reached from the base of the page', () => {
    expect(parseFrontConfig(rawConfig, 'https://example.com/echo/app/')).toStrictEqual({
      ...config,
      appUrl: 'https://example.com/echo/app',
      apiUrl: 'https://example.com/echo/api'
    })
  })

  test('Should read a number of days ago written as a number', () => {
    expect(
      parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: 2 }, BASE_URI)
    ).toStrictEqual(config)
  })

  test('Should accept the same initial and minimal number of days ago', () => {
    expect(
      parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: '14' }, BASE_URI)
    ).toStrictEqual({
      ...config,
      logsInitialDate: new Date(2026, 3, 14)
    })
  })

  test('Should throw the error of the common config', () => {
    expect(() => parseFrontConfig({ ...rawConfig, SERVER_NAME: undefined }, BASE_URI)).toThrow(
      'Missing required environment variable: SERVER_NAME'
    )
  })

  test('Should throw if LOGS_INITIAL_DATE_DAYS_AGO is missing', () => {
    expect(() =>
      parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: undefined }, BASE_URI)
    ).toThrow('Missing required environment variable: LOGS_INITIAL_DATE_DAYS_AGO')
  })

  test('Should throw if LOGS_MINIMAL_DATE_DAYS_AGO is invalid', () => {
    expect(() =>
      parseFrontConfig({ ...rawConfig, LOGS_MINIMAL_DATE_DAYS_AGO: 'two' }, BASE_URI)
    ).toThrow('LOGS_MINIMAL_DATE_DAYS_AGO: Invalid integer: two is not an integer')
  })

  test('Should throw if the logs start further back than the oldest date allowed', () => {
    expect(() =>
      parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: '15' }, BASE_URI)
    ).toThrow(
      'Invalid LOGS_INITIAL_DATE_DAYS_AGO: 15 is greater than LOGS_MINIMAL_DATE_DAYS_AGO (14)'
    )
  })
})
