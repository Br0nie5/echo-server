/** Shape every locale must implement. It also defines the valid translation keys. */
export interface TranslationKeys {
  auth: {
    wall: string
    form: {
      username: string
      password: string
      enterCredentials: string
      fieldsRequired: string
    }
    login: {
      button: string
      success: string
      invalidCredentials: string
    }
    signUp: {
      button: string
      success: string
    }
    redirect: {
      message: string
      button: string
    }
    error: string
  }
  logs: {
    viewer: string
    from: string
    filterByCategory: string
    searchPlaceholder: string
    searchButton: string
    noGroupLabel: string
  }
  query: {
    noData: string
    error: string
    refetchButton: string
  }
  utils: {
    today: string
    yesterday: string
  }
}
