import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { Button, Input, Avatar, Spin, Tag, Typography, Empty, Badge, Popconfirm, message as antMsg } from 'antd'
import { SendOutlined, UserOutlined, CloseCircleOutlined, ArrowLeftOutlined, CustomerServiceOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, PaperClipOutlined, FilePdfOutlined, AudioOutlined, PauseOutlined } from '@ant-design/icons'
import { formatDateTime } from '@/utils/format'

const { Text } = Typography

const Chat = () => {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const messagesEndRef = useRef(null)
  const intervalRef = useRef(null)
  const [mobileView, setMobileView] = useState('list')
  const fileInputRef = useRef(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    const fetchChats = async () => {
      try {
        const data = await api.get('/chats')
        const allChats = Array.isArray(data) ? data : []
        setChats(allChats.filter(c => c.status !== 'closed'))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchChats()
    intervalRef.current = setInterval(fetchChats, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }
    let msgInterval
    const fetchMessages = async () => {
      try {
        const data = await api.get(`/chats/${selectedChat._id}/messages`)
        setMessages(Array.isArray(data) ? data : [])
      } catch {
        // ignore
      } finally {
        setMsgLoading(false)
      }
    }
    fetchMessages()
    msgInterval = setInterval(fetchMessages, 3000)
    return () => { if (msgInterval) clearInterval(msgInterval) }
  }, [selectedChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat)
    setMessages([])
    setMsgLoading(true)
    setMobileView('chat')
    try {
      await api.put(`/chats/${chat._id}/read`)
    } catch {
      // ignore
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const maxSize = 50 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      antMsg.error('File too large. Max 50MB allowed.')
      return
    }

    setFile(selectedFile)
    if (selectedFile.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(selectedFile))
    } else {
      setFilePreview(null)
    }
  }

  const handleSend = async () => {
    if ((!newMessage.trim() && !file && !audioBlob) || !selectedChat) return
    
    setMsgLoading(true)
    try {
      if (audioBlob) {
        const formData = new FormData()
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        formData.append('file', audioFile)
        formData.append('text', newMessage.trim())
        formData.append('messageType', 'audio')
        await api.post(`/chats/${selectedChat._id}/messages`, formData, true)
        setAudioBlob(null)
        setRecordingTime(0)
      } else if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('text', newMessage.trim())
        let msgType = 'text'
        if (file.type.startsWith('image/')) msgType = 'image'
        else if (file.type.startsWith('audio/')) msgType = 'audio'
        else if (file.type.startsWith('video/')) msgType = 'video'
        else if (file.type === 'application/pdf') msgType = 'pdf'
        formData.append('messageType', msgType)
        await api.post(`/chats/${selectedChat._id}/messages`, formData, true)
      } else {
        await api.post(`/chats/${selectedChat._id}/text`, { text: newMessage.trim() })
      }
      setNewMessage('')
      setFile(null)
      setFilePreview(null)
      const data = await api.get(`/chats/${selectedChat._id}/messages`)
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      antMsg.error('Failed to send message')
    } finally {
      setMsgLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
        if (audioContextRef.current) audioContextRef.current.close()
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      drawWaveform()
    } catch (err) {
      antMsg.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setAudioBlob(null)
    setRecordingTime(0)
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    if (audioContextRef.current) audioContextRef.current.close()
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = '#f0f2f5'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        ctx.fillStyle = '#1d3557'
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
    }
    draw()
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleCloseChat = async (chatId) => {
    try {
      await api.put(`/chats/${chatId}/close`, { status: 'closed' })
      setChats(prev => prev.filter(c => c._id !== chatId))
      if (selectedChat?._id === chatId) {
        setSelectedChat(null)
        setMobileView('list')
      }
      window.toastify('Chat closed', 'success')
    } catch (err) {
      console.error(err)
      window.toastify('Failed to close chat', 'error')
    }
  }

  const handleBlockUser = async (chatId) => {
    try {
      await api.put(`/chats/${chatId}/block`, {})
      setChats(prev => prev.filter(c => c._id !== chatId))
      if (selectedChat?._id === chatId) {
        setSelectedChat(null)
        setMobileView('list')
      }
      window.toastify('User blocked', 'success')
    } catch (err) {
      console.error(err)
      window.toastify('Failed to block user', 'error')
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`)
      setChats(prev => prev.filter(c => c._id !== chatId))
      if (selectedChat?._id === chatId) {
        setSelectedChat(null)
        setMobileView('list')
      }
      window.toastify('Chat deleted', 'success')
    } catch (err) {
      console.error(err)
      window.toastify('Failed to delete chat', 'error')
    }
  }

  const getLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet'
    const text = typeof chat.lastMessage === 'string' ? chat.lastMessage : chat.lastMessage.text
    return text?.substring(0, 40) + (text?.length > 40 ? '...' : '')
  }

  const getChatTime = (chat) => {
    const date = chat.updatedAt || chat.createdAt
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' })
  }

  const renderFileMessage = (msg) => {
    if (msg.messageType === 'image' && msg.fileUrl) {
      return (
        <div>
          {msg.text && <div style={{ marginBottom: 6 }}>{msg.text}</div>}
          <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(msg.fileUrl)} />
        </div>
      )
    }
    if (msg.messageType === 'audio' && msg.fileUrl) {
      return (
        <div>
          {msg.text && <div style={{ marginBottom: 6 }}>{msg.text}</div>}
          <audio controls style={{ width: '100%', maxHeight: 40 }}>
            <source src={msg.fileUrl} />
          </audio>
        </div>
      )
    }
    if (msg.messageType === 'video' && msg.fileUrl) {
      return (
        <div>
          {msg.text && <div style={{ marginBottom: 6 }}>{msg.text}</div>}
          <video controls style={{ width: '100%', maxHeight: 200, borderRadius: 8 }}>
            <source src={msg.fileUrl} />
          </video>
        </div>
      )
    }
    if (msg.messageType === 'pdf' && msg.fileUrl) {
      return (
        <div>
          {msg.text && <div style={{ marginBottom: 6 }}>{msg.text}</div>}
          <div
            onClick={() => window.open(msg.fileUrl)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0f0f0', borderRadius: 8, cursor: 'pointer' }}
          >
            <FilePdfOutlined style={{ fontSize: 24, color: '#e74c3c' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{msg.fileName || 'Document'}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : ''}</div>
            </div>
          </div>
        </div>
      )
    }
    return <div>{msg.text}</div>
  }

  return (
    <>
      <div style={{ display: 'flex', height: 'calc(100vh - 140px)', marginTop: 24, background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
        {/* Conversations sidebar */}
        <div
          style={{
            width: 360,
            borderRight: '1px solid #e8e8e8',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            flexShrink: 0,
          }}
          className="chat-sidebar"
        >
          <div style={{ padding: '14px 16px', background: '#1d3557', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CustomerServiceOutlined style={{ fontSize: 20 }} />
            Chat Support
          </div>
          {loading ? (
            <Spin style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
          ) : chats.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text type="secondary">No conversations yet</Text>
            </Empty>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: selectedChat?._id === chat._id ? '#f0f2f5' : '#fff',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (selectedChat?._id !== chat._id) e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={(e) => { if (selectedChat?._id !== chat._id) e.currentTarget.style.background = '#fff' }}
                >
                  <Badge dot={chat.unreadCount > 0} offset={[-3, 3]}>
                    <Avatar
                      src="https://admissions.comsats.edu.pk/content/images/icoperson.jpg"
                      style={{
                        backgroundColor: '#1d3557',
                        width: 48,
                        height: 48,
                      }}
                    />
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: chat.unreadCount > 0 ? 700 : 500, fontSize: 15, color: '#111' }}>
                        {chat.userName || chat.userEmail || 'Customer'}
                      </span>
                      <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>{getChatTime(chat)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {chat.status === 'blocked' ? 'Blocked' : getLastMessage(chat)}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {chat.unreadCount > 0 && (
                          <Badge count={chat.unreadCount} style={{ backgroundColor: '#1d3557' }} />
                        )}
                        {chat.status === 'blocked' && (
                          <Tag color="red" style={{ margin: 0, fontSize: 10 }}>Blocked</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="chat-main">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #e8e8e8',
                background: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  className="chat-back-btn"
                  onClick={() => { setMobileView('list'); setSelectedChat(null) }}
                  style={{ display: 'none' }}
                />
                <Avatar
                  src="https://admissions.comsats.edu.pk/content/images/icoperson.jpg"
                  style={{ backgroundColor: '#1d3557' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedChat.userName || selectedChat.userEmail || 'Customer'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{selectedChat.userEmail}</div>
                </div>
                {selectedChat.status === 'blocked' && (
                  <Tag color="red" style={{ margin: 0 }}>Blocked</Tag>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  {selectedChat.status === 'active' && (
                    <>
                      <Popconfirm title="Close this chat?" onConfirm={() => handleCloseChat(selectedChat._id)}>
                        <Button size="small" icon={<CloseCircleOutlined />}>Close</Button>
                      </Popconfirm>
                      <Popconfirm title="Block this user?" onConfirm={() => handleBlockUser(selectedChat._id)}>
                        <Button size="small" danger icon={<StopOutlined />}>Block</Button>
                      </Popconfirm>
                    </>
                  )}
                  <Popconfirm title="Delete this chat permanently?" onConfirm={() => handleDeleteChat(selectedChat._id)}>
                    <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
                  </Popconfirm>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#e5ddd5', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cdc4\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                {selectedChat.status === 'blocked' && (
                  <div style={{ textAlign: 'center', padding: '12px 0', marginBottom: 12, background: '#fff3cd', borderRadius: 8, border: '1px solid #ffc107' }}>
                    <StopOutlined style={{ color: '#e74c3c', marginRight: 8 }} />
                    <Text type="danger">This user is blocked.</Text>
                  </div>
                )}
                {msgLoading && messages.length === 0 ? (
                  <Spin style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />
                ) : messages.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ textAlign: 'center', marginTop: 50 }}
                  >
                    <Text type="secondary">No messages yet</Text>
                  </Empty>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isAdmin = msg.senderRole === 'admin'
                      return (
                        <div
                          key={msg._id}
                          style={{
                            display: 'flex',
                            justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                            marginBottom: 8,
                          }}
                        >
                          {!isAdmin && (
                            <Avatar
                              src="https://admissions.comsats.edu.pk/content/images/icoperson.jpg"
                              size={32}
                              style={{ marginRight: 8, marginTop: 4, flexShrink: 0 }}
                            />
                          )}
                          <div style={{ maxWidth: '70%' }}>
                            <div
                              style={{
                                padding: '8px 12px',
                                borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                backgroundColor: isAdmin ? '#dcf8c6' : '#fff',
                                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                              }}
                            >
                              {msg.messageType && msg.messageType !== 'text' ? (
                                renderFileMessage(msg)
                              ) : (
                                <div style={{ fontSize: 13, lineHeight: 1.5, color: '#111', wordBreak: 'break-word' }}>{msg.text}</div>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: isAdmin ? 'right' : 'left', padding: '0 4px' }}>
                              <span style={{ fontWeight: 500 }}>{msg.senderName}</span> · {formatDateTime(msg.createdAt)}
                            </div>
                          </div>
                          {isAdmin && (
                            <Avatar
                              src="https://admissions.comsats.edu.pk/content/images/icooperator.jpg"
                              size={32}
                              style={{ marginLeft: 8, marginTop: 4, flexShrink: 0 }}
                            />
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* File Preview */}
              {file && (
                <div style={{ padding: '8px 16px', background: '#f0f2f5', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {filePreview ? (
                    <img src={filePreview} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <FilePdfOutlined style={{ fontSize: 24, color: '#e74c3c' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <Button size="small" type="text" icon={<CloseCircleOutlined />} onClick={() => { setFile(null); setFilePreview(null) }} />
                </div>
              )}

              {/* Recording UI */}
              {isRecording && (
                <div style={{ padding: '12px 16px', background: '#f0f2f5', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1s infinite' }} />
                    <Text style={{ fontWeight: 600, color: '#e74c3c' }}>{formatTime(recordingTime)}</Text>
                  </div>
                  <canvas ref={canvasRef} width={200} height={40} style={{ borderRadius: 8, flex: 1 }} />
                  <Button size="small" danger onClick={cancelRecording}>Cancel</Button>
                  <Button size="small" type="primary" icon={<PauseOutlined />} onClick={stopRecording} style={{ background: '#1d3557', borderColor: '#1d3557' }}>Send</Button>
                </div>
              )}

              {/* Audio Blob Preview */}
              {audioBlob && !isRecording && (
                <div style={{ padding: '8px 16px', background: '#f0f2f5', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <audio controls src={URL.createObjectURL(audioBlob)} style={{ flex: 1 }} />
                  <Button size="small" type="text" icon={<CloseCircleOutlined />} onClick={() => { setAudioBlob(null); setRecordingTime(0) }} />
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e8e8e8', background: '#f0f2f5', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: 18 }}
                />
                {!isRecording && !audioBlob && (
                  <Button
                    type="text"
                    icon={<AudioOutlined />}
                    onClick={startRecording}
                    style={{ fontSize: 18, color: '#e74c3c' }}
                  />
                )}
                <Input.TextArea
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ borderRadius: 8, flex: 1 }}
                  disabled={isRecording}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={msgLoading}
                  disabled={isRecording}
                  style={{ backgroundColor: '#1d3557', borderColor: '#1d3557', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
              <div style={{ textAlign: 'center' }}>
                <CustomerServiceOutlined style={{ fontSize: 60, color: '#1d3557', marginBottom: 16 }} />
                <div style={{ fontSize: 16, color: '#666' }}>Select a conversation to start chatting</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .chat-sidebar { width: 100% !important; display: ${mobileView === 'list' ? 'flex' : 'none'} !important; }
          .chat-main { display: ${mobileView === 'chat' ? 'flex' : 'none'} !important; }
          .chat-back-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}

export default Chat
