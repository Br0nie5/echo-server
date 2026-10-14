import type { TranslationKeys } from './types'

export const english: TranslationKeys = {
  auth: {
    title: 'Authentication',
    form: {
      username: 'Username',
      password: 'Password',
      enterCredentials: 'Enter your username and password.',
      fieldsRequired: 'Enter both a username and a password.'
    },
    login: {
      button: 'Log in',
      invalidCredentials: 'Incorrect username or password.'
    },
    signUp: {
      button: 'Sign up'
    },
    redirect: {
      message: 'You are already logged in. If nothing happens, go to:'
    },
    error: 'The request failed. Please try again.'
  },
  logs: {
    title: 'Logs',
    from: 'From',
    filterByLevel: 'Levels',
    searchPlaceholder: 'Search… (e.g. jobId:123 message:"disk full")',
    noGroupLabel: 'No group'
  },
  query: {
    noData: 'Nothing found.',
    error: 'Something went wrong.',
    refetchButton: 'Try again'
  },
  utils: {
    today: 'Today',
    yesterday: 'Yesterday',
    searchPlaceholder: 'Search…',
    searchButton: 'Search'
  }
}
