import { testConfig } from '../../../../test/utils/config'
import { parseFrontConfig } from '../parseFrontConfig'

const rawConfig = {
  SERVER_NAME: testConfig.SERVER_NAME,
  SERVER_URL: testConfig.SERVER_URL,
  HAS_AUTHENTICATION: 'true',
  LOGS_INITIAL_DATE_DAYS_AGO: '2',
  LOGS_MINIMAL_DATE_DAYS_AGO: '14'
}

describe('parseFrontConfig', () => {
  test('Should parse a fully provided config', () => {
    expect(parseFrontConfig(rawConfig)).toStrictEqual(testConfig)
  })

  test('Should accept the same initial and minimal number of days ago', () => {
    expect(parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: '14' })).toStrictEqual({
      ...testConfig,
      LOGS_INITIAL_DATE_DAYS_AGO: 14
    })
  })

  test('Should throw the error of the common config', () => {
    expect(() => parseFrontConfig({ ...rawConfig, SERVER_NAME: undefined })).toThrow(
      'Missing required environment variable: SERVER_NAME'
    )
  })

  test('Should throw if LOGS_INITIAL_DATE_DAYS_AGO is missing', () => {
    expect(() => parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: undefined })).toThrow(
      'Missing required environment variable: LOGS_INITIAL_DATE_DAYS_AGO'
    )
  })

  test('Should throw if LOGS_MINIMAL_DATE_DAYS_AGO is invalid', () => {
    expect(() => parseFrontConfig({ ...rawConfig, LOGS_MINIMAL_DATE_DAYS_AGO: 'two' })).toThrow(
      'Invalid LOGS_MINIMAL_DATE_DAYS_AGO: two is not a positive integer or zero'
    )
  })

  test('Should throw if the logs start further back than the oldest date allowed', () => {
    expect(() => parseFrontConfig({ ...rawConfig, LOGS_INITIAL_DATE_DAYS_AGO: '15' })).toThrow(
      'Invalid LOGS_INITIAL_DATE_DAYS_AGO: 15 is greater than LOGS_MINIMAL_DATE_DAYS_AGO (14)'
    )
  })
})
