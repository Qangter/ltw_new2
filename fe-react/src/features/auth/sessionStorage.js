// Legacy keys; stored user is a compatibility snapshot, NEVER authority.
export function createSessionStorage(getStorage = () => window.localStorage) {
  return {
    readToken() {
      try {
        const token = getStorage().getItem('token')
        return token && !['null', 'undefined'].includes(token.trim()) ? token.trim() : null
      } catch { return null }
    },
    save(token, user) {
      try {
        const storage = getStorage()
        storage.setItem('token', token)
        if (user) storage.setItem('user', JSON.stringify(user))
        else storage.removeItem('user')
        return true
      } catch { return false }
    },
    clear() {
      try {
        const storage = getStorage()
        storage.removeItem('token')
        storage.removeItem('user')
        return true
      } catch { return false }
    },
  }
}
