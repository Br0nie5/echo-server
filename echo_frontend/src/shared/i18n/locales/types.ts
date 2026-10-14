/** The shape every locale implements, which also defines the valid translation keys. */
export interface TranslationKeys {
  auth: {
    title: string
    form: {
      username: string
      password: string
      enterCredentials: string
      fieldsRequired: string
    }
    login: {
      button: string
      invalidCredentials: string
    }
    signUp: {
      button: string
    }
    redirect: {
      message: string
    }
    error: string
  }
  logs: {
    title: string
    from: string
    filterByLevel: string
    searchPlaceholder: string
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
    searchPlaceholder: string
    searchButton: string
  }
}
