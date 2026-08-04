const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('token')

const handleUnauthorized = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  if (window.location.pathname.startsWith('/dashboard')) {
    window.location.href = '/auth/login'
  }
}

const headers = (extra = {}) => {
  const h = { ...extra }
  const token = getToken()
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

const parseResponse = async (res) => {
  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Session expired. Please login again.')
  }
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: headers() })
    if (!res.ok) {
      const err = await parseResponse(res).catch(() => ({ error: 'Request failed' }))
      throw new Error(err?.error || 'Request failed')
    }
    return parseResponse(res)
  },

  post: async (path, body, isFormData = false) => {
    const opts = { method: 'POST', headers: headers() }
    if (isFormData) {
      opts.body = body
    } else {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
    const res = await fetch(`${API_BASE}${path}`, opts)
    if (!res.ok) {
      const err = await parseResponse(res).catch(() => ({ error: 'Request failed' }))
      throw new Error(err?.error || 'Request failed')
    }
    return parseResponse(res)
  },

  put: async (path, body, isFormData = false) => {
    const opts = { method: 'PUT', headers: headers() }
    if (isFormData) {
      opts.body = body
    } else if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
    const res = await fetch(`${API_BASE}${path}`, opts)
    if (!res.ok) {
      const err = await parseResponse(res).catch(() => ({ error: 'Request failed' }))
      throw new Error(err?.error || 'Request failed')
    }
    return parseResponse(res)
  },

  delete: async (path, body = undefined) => {
    const opts = { method: 'DELETE', headers: headers() }
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
    const res = await fetch(`${API_BASE}${path}`, opts)
    if (!res.ok) {
      const err = await parseResponse(res).catch(() => ({ error: 'Request failed' }))
      throw new Error(err?.error || 'Request failed')
    }
    return parseResponse(res)
  },
}
