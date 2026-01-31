const TOKEN_STORAGE_KEY = "docky_google_access_token"

export function getStoredGoogleAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredGoogleAccessToken(token: string | null) {
  if (typeof window === "undefined") {
    return
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}
