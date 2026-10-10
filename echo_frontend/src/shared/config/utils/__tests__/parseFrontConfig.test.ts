import { mockConfig } from '../../../../test/utils/mockConfig'
import { parseFrontConfig } from '../parseFrontConfig'

const BASE_URI = `${mockConfig.APP_URL}/`

const rawConfig = {
  SERVER_NAME: mockConfig.SERVER_NAME,
  HAS_AUTHENTICATION: 'true',
  LOGS_INITIAL_DATE_DAYS_AGO: '2',
  LOGS_MINIMAL_DATE_DAYS_AGO: '14'
}

describe('parseFrontConfig', () => {
  test('Should parse a fully provided config', () => {
    expect(parseFrontConfig(rawConfig, BASE_URI)).toStrictEqual(mockConfig)
  })

  test('Should read where the app and the API are reached from the base of the page', () => {
    expect(parseFrontConfig(rawConfig, 'https://example.com/echo/app/')).toStrictEqual({
      ...mockConfig,
      APP_URL: 'https://example.com/echo/app',
      API_URL: 'https://example.com/echo/api'
    })
  })

  test('Should accept the same initial and minimal number of days ago', () => {
    expect(
      parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: '14' }, BASE_URI)
    ).toStrictEqual({
      ...mockConfig,
      LOGS_INITIAL_DATE_DAYS_AGO: 14
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
    ).toThrow('Invalid LOGS_MINIMAL_DATE_DAYS_AGO: two is not a positive integer or zero')
  })

  test('Should throw if the logs start further back than the oldest date allowed', () => {
    expect(() =>
      parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: '15' }, BASE_URI)
    ).toThrow(
      'Invalid LOGS_INITIAL_DATE_DAYS_AGO: 15 is greater than LOGS_MINIMAL_DATE_DAYS_AGO (14)'
    )
  })
})
