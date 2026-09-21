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
      success: 'Success login!',
      invalidCredentials: 'Either `username` or/and `password` are incorrect'
    },
    signUp: {
      button: 'Sign up',
      success: 'Success sign up!'
    },
    redirect: {
      message: 'You are already logged, you can go on!',
      button: 'Continue'
    },
    error: 'An error occurred'
  },
  logs: {
    viewer: 'Logs Viewer',
    from: 'From',
    filterByCategory: 'Filter Logs by Category:',
    searchPlaceholder: 'Search... (ex: jobId:123 message:"My wanted message")',
    searchButton: 'Search',
    noGroupLabel: 'No group'
  },
  query: {
    noData: 'No data has been found',
    error: 'An error occurred.',
    refetchButton: 'Click to refresh.'
  },
  utils: {
    today: 'Today',
    yesterday: 'Yesterday'
  }
}
