const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/+$/, '')

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.replace(/^\/+/, '')
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail
      } else if (Array.isArray(errorBody.detail)) {
        const validationMessages = errorBody.detail
          .map((issue) => issue.msg)
          .filter(Boolean)
        if (validationMessages.length > 0) {
          message = validationMessages.join(' ')
        }
      }
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
