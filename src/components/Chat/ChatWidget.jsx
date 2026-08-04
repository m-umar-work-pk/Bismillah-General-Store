import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/Auth'
import { createOrGetChat, markMessagesAsRead, getChat, subscribeToMessages } from '@/utils/chat'
import { Button, Input, Avatar, Typography, Badge, message as antMsg } from 'antd'
import { MessageOutlined, SendOutlined, CloseOutlined, CustomerServiceOutlined, PaperClipOutlined, FilePdfOutlined, AudioOutlined, PauseOutlined } from '@ant-design/icons'
import { formatDateTime } from '@/utils/format'
import { api } from '@/config/api'

const { Text } = Typography

const ChatWidget = () => {
  const { user, isAuth } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState(null)
  const [chatStatus, setChatStatus] = useState('active')
  const [unreadCount, setUnreadCount] = useState(0)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const messagesEndRef = useRef(null)
  const unsubscribeRef = useRef(null)
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

  const initChat = async () => {
    try {
      const chat = await createOrGetChat(user.uid, user.email, user.fullName || 'Customer')
      if (chat.error === 'blocked') {
        setBlocked(true)
        return
      }
      if (!chat || !chat._id) {
        return
      }
      setBlocked(false)
      setChatId(chat._id || chat.id)
      setChatStatus(chat.status || 'active')

      if (unsubscribeRef.current) unsubscribeRef.current()
      unsubscribeRef.current = subscribeToMessages(chat._id || chat.id, (msgs) => {
        setMessages(msgs)
        const unread = msgs.filter(m => !m.read && m.senderId !== user.uid).length
        setUnreadCount(unread)
      })
    } catch (err) {
      console.error('Chat init error:', err)
    }
  }

  useEffect(() => {
    if (!isAuth || !user) return
    initChat()
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
  }, [isAuth, user])

  // Poll chat status every 3 seconds
  useEffect(() => {
    if (!chatId) return
    let cancelled = false
    let failCount = 0
    const MAX_FAILS = 3
    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const chat = await getChat(chatId)
        if (cancelled) return
        failCount = 0
        if (!chat || !chat._id) {
          cancelled = true
          clearInterval(interval)
          setChatId(null)
          setChatStatus(null)
          setMessages([])
          setBlocked(false)
          if (unsubscribeRef.current) unsubscribeRef.current()
          return
        }
        setChatStatus(chat.status)
        if (chat.status === 'blocked') {
          setBlocked(true)
        } else if (chat.status === 'closed') {
          setChatStatus('closed')
        }
      } catch {
        if (cancelled) return
        failCount++
        if (failCount >= MAX_FAILS) {
          cancelled = true
          clearInterval(interval)
          setChatId(null)
          setChatStatus(null)
          setMessages([])
          setBlocked(false)
          if (unsubscribeRef.current) unsubscribeRef.current()
        }
      }
    }, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [chatId])

  // Re-init chat when chatId becomes null (e.g. after admin deletes)
  const reInitTimerRef = useRef(null)
  useEffect(() => {
    if (isAuth && user && !chatId && !blocked) {
      if (reInitTimerRef.current) clearTimeout(reInitTimerRef.current)
      reInitTimerRef.current = setTimeout(() => initChat(), 1500)
      return () => { clearTimeout(reInitTimerRef.current) }
    }
  }, [chatId, isAuth, user, blocked])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const handleSend = async (e) => {
    e?.preventDefault()
    if ((!newMessage.trim() && !file && !audioBlob) || !chatId || sending || blocked || chatStatus === 'closed') return

    setSending(true)
    try {
      if (audioBlob) {
        const formData = new FormData()
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        formData.append('file', audioFile)
        formData.append('text', newMessage.trim())
        formData.append('messageType', 'audio')
        await api.post(`/chats/${chatId}/messages`, formData, true)
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
        await api.post(`/chats/${chatId}/messages`, formData, true)
      } else {
        await api.post(`/chats/${chatId}/text`, { text: newMessage.trim() })
      }
      setNewMessage('')
      setFile(null)
      setFilePreview(null)
    } catch (err) {
      console.error('Send message error:', err)
      if (err.message?.includes('blocked')) {
        setBlocked(true)
      } else if (err.message?.includes('closed')) {
        setChatStatus('closed')
      } else if (err.message?.includes('not found') || err.message?.includes('Chat not found')) {
        antMsg.error('Chat not found. Reconnecting...')
        setChatId(null)
        setChatStatus(null)
        setMessages([])
        setBlocked(false)
        if (unsubscribeRef.current) unsubscribeRef.current()
      } else {
        antMsg.error(err.message || 'Failed to send message')
      }
    } finally {
      setSending(false)
    }
  }

  const handleOpen = async () => {
    setOpen(true)
    if (chatId) {
      await markMessagesAsRead(chatId, user.uid)
      setUnreadCount(0)
    }
  }

  const handleClose = () => {
    setOpen(false)
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

  if (!isAuth || !user) return null

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
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined />}
          onClick={handleOpen}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1001,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            backgroundColor: '#1d3557',
            borderColor: '#1d3557',
            width: 56,
            height: 56,
            fontSize: 22,
          }}
        />
      </Badge>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: 92,
          right: 24,
          width: 380,
          maxHeight: 'calc(100vh - 120px)',
          zIndex: 1000,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
        }}>
          {/* Header */}
          <div style={{
            background: '#1d3557',
            color: '#fff',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            <Avatar
              src="https://admissions.comsats.edu.pk/content/images/icooperator.jpg"
              style={{ backgroundColor: '#fff' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Bismillah Support</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {blocked ? 'Account blocked' : chatStatus === 'closed' ? 'Chat closed' : 'We typically reply within minutes'}
              </div>
            </div>
            <Button type="text" icon={<CloseOutlined style={{ color: '#fff', fontSize: 16 }} />} onClick={handleClose} />
          </div>

          {/* Messages */}
          <div style={{
            height: 400,
            overflowY: 'auto',
            padding: 16,
            background: '#e5ddd5',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cdc4\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            flex: 1,
          }}>
            {blocked ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CloseOutlined style={{ fontSize: 48, color: '#e74c3c', marginBottom: 12 }} />
                <div style={{ color: '#e74c3c', fontSize: 14, fontWeight: 600 }}>Account Blocked</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>Please contact support for assistance</div>
              </div>
            ) : chatStatus === 'closed' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CloseOutlined style={{ fontSize: 48, color: '#999', marginBottom: 12 }} />
                <div style={{ color: '#666', fontSize: 14, fontWeight: 600 }}>Chat Closed</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>This conversation has been closed</div>
                <Button
                  type="primary"
                  size="small"
                  style={{ marginTop: 12, backgroundColor: '#1d3557', borderColor: '#1d3557' }}
                  onClick={async () => {
                    setChatId(null)
                    setChatStatus(null)
                    setMessages([])
                    if (unsubscribeRef.current) unsubscribeRef.current()
                  }}
                >
                  Start New Chat
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CustomerServiceOutlined style={{ fontSize: 48, color: '#1d3557', marginBottom: 12 }} />
                <div style={{ color: '#666', fontSize: 14 }}>Start a conversation with our support team</div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.senderId === user.uid
                return (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    {!isUser && (
                      <Avatar
                        src="https://admissions.comsats.edu.pk/content/images/icooperator.jpg"
                        size={32}
                        style={{ backgroundColor: '#1d3557', marginRight: 8, marginTop: 4, flexShrink: 0 }}
                      />
                    )}
                    <div style={{ maxWidth: '75%' }}>
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          backgroundColor: isUser ? '#dcf8c6' : '#fff',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                        }}
                      >
                        {msg.messageType && msg.messageType !== 'text' ? (
                          renderFileMessage(msg)
                        ) : (
                          <div style={{ fontSize: 13, lineHeight: 1.5, color: '#111', wordBreak: 'break-word' }}>{msg.text}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: isUser ? 'right' : 'left', padding: '0 4px' }}>
                        {formatDateTime(msg.createdAt)}
                      </div>
                    </div>
                    {isUser && (
                      <Avatar
                        src="https://admissions.comsats.edu.pk/content/images/icoperson.jpg"
                        size={32}
                        style={{ marginLeft: 8, marginTop: 4, flexShrink: 0 }}
                      />
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Preview */}
          {file && (
            <div style={{ padding: '8px 16px', background: '#f0f2f5', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {filePreview ? (
                <img src={filePreview} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <FilePdfOutlined style={{ fontSize: 24, color: '#e74c3c' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => { setFile(null); setFilePreview(null) }} />
            </div>
          )}

          {/* Recording UI */}
          {isRecording && (
            <div style={{ padding: '12px 16px', background: '#f0f2f5', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1s infinite' }} />
                <Text style={{ fontWeight: 600, color: '#e74c3c' }}>{formatTime(recordingTime)}</Text>
              </div>
              <canvas ref={canvasRef} width={150} height={40} style={{ borderRadius: 8, flex: 1 }} />
              <Button size="small" danger onClick={cancelRecording}>Cancel</Button>
              <Button size="small" type="primary" icon={<PauseOutlined />} onClick={stopRecording} style={{ background: '#1d3557', borderColor: '#1d3557' }}>Send</Button>
            </div>
          )}

          {/* Audio Blob Preview */}
          {audioBlob && !isRecording && (
            <div style={{ padding: '8px 16px', background: '#f0f2f5', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <audio controls src={URL.createObjectURL(audioBlob)} style={{ flex: 1 }} />
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => { setAudioBlob(null); setRecordingTime(0) }} />
            </div>
          )}

          {/* Input */}
          {!blocked && chatStatus !== 'closed' && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #e8e8e8', background: '#f0f2f5', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
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
                loading={sending}
                disabled={isRecording}
                style={{ backgroundColor: '#1d3557', borderColor: '#1d3557', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  )
}

export default ChatWidget
