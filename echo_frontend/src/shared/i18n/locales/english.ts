import type { TranslationKeys } from './types'

export const english: TranslationKeys = {
  auth: {
    wall: 'Auth Wall',
    form: {
      username: 'username',
      password: 'password',
      enterCredentials: 'Please enter your credentials',
      fieldsRequired: 'Parameters `username` and `password` are required'
    },
    login: {
      button: 'Login',
      invalidCredentials: 'Either `username` or/and `password` are incorrect'
    },
    signUp: {
      button: 'Sign up'
    },
    redirect: {
      message: 'You are already logged in, you should be redirected to:'
    },
    error: 'An error occurred'
  },
  logs: {
    viewer: 'Logs Viewer',
    from: 'From',
    filterByLevel: 'Filter Logs by Level:',
    searchPlaceholder: 'Search... (ex: jobId:123 message:"My wanted message")',
    noGroupLabel: 'No group'
  },
  query: {
    noData: 'No data has been found',
    error: 'An error occurred.',
    refetchButton: 'Click to refresh.'
  },
  utils: {
    today: 'Today',
    yesterday: 'Yesterday',
    searchPlaceholder: 'Type your search here...',
    searchButton: 'Search'
  }
}
