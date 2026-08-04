import { api } from '@/config/api'

export const createOrGetChat = async (userId, userEmail, userName) => {
  try {
    const data = await api.post('/chats', { userId, userEmail, userName })
    return data
  } catch (err) {
    if (err.message?.includes('blocked')) {
      return { error: 'blocked' }
    }
    throw err
  }
}

export const sendMessage = async (chatId, _senderId, _senderName, _senderRole, text) => {
  const formData = new FormData()
  formData.append('text', text)
  formData.append('messageType', 'text')
  await api.post(`/chats/${chatId}/messages`, formData, true)
}

export const getChat = async (chatId) => {
  return await api.get(`/chats/${chatId}`)
}

export const subscribeToMessages = (chatId, callback) => {
  let interval
  let stopped = false
  const fetchMessages = async () => {
    if (stopped) return
    try {
      const data = await api.get(`/chats/${chatId}/messages`)
      if (!stopped) callback(Array.isArray(data) ? data : [])
    } catch {
      // chat may have been deleted — stop polling
    }
  }
  fetchMessages()
  interval = setInterval(fetchMessages, 3000)
  return () => { stopped = true; clearInterval(interval) }
}

export const subscribeToUserChats = (userId, callback) => {
  let interval
  const fetchChats = async () => {
    try {
      const data = await api.get('/chats')
      callback(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    }
  }
  fetchChats()
  interval = setInterval(fetchChats, 5000)
  return () => { clearInterval(interval) }
}

export const subscribeToAllChats = (callback) => {
  let interval
  const fetchChats = async () => {
    try {
      const data = await api.get('/chats')
      callback(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    }
  }
  fetchChats()
  interval = setInterval(fetchChats, 5000)
  return () => { clearInterval(interval) }
}

export const markMessagesAsRead = async (chatId) => {
  await api.put(`/chats/${chatId}/read`)
}

export const closeChat = async (chatId) => {
  await api.put(`/chats/${chatId}/close`)
}

export const blockChat = async (chatId) => {
  await api.put(`/chats/${chatId}/block`)
}

export const unblockChat = async (chatId) => {
  await api.put(`/chats/${chatId}/unblock`)
}

export const deleteChat = async (chatId) => {
  await api.delete(`/chats/${chatId}`)
}
