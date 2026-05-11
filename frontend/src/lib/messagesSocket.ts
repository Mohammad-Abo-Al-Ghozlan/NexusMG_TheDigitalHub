import { useAuthStore } from '@/stores/authStore'
import { useMessagesStore, type InboundChatMessage } from '@/stores/messagesStore'

export type MessagesSocketStatus = 'connecting' | 'connected' | 'disconnected'

const buildWebSocketUrl = (path: string) => {
  const apiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
  const basePath = apiBase.startsWith('http')
    ? new URL(apiBase).pathname.replace(/\/$/, '')
    : apiBase
  const origin = apiBase.startsWith('http')
    ? (() => {
        const url = new URL(apiBase)
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${protocol}//${url.host}`
      })()
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${basePath}${normalizedPath}`
}

type MessageListener = (message: InboundChatMessage) => void
type StatusListener = (status: MessagesSocketStatus) => void

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let intentionalClose = false
let publicStatus: MessagesSocketStatus = 'disconnected'
const messageListeners = new Set<MessageListener>()
const statusListeners = new Set<StatusListener>()

function emitStatus(s: MessagesSocketStatus) {
  publicStatus = s
  statusListeners.forEach((fn) => fn(s))
}

function clearReconnect() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function openSocket() {
  const token = localStorage.getItem('access_token')
  if (!token) {
    emitStatus('disconnected')
    return
  }

  clearReconnect()
  intentionalClose = false
  emitStatus('connecting')

  const ws = new WebSocket(`${buildWebSocketUrl('/messages/ws')}?token=${encodeURIComponent(token)}`)
  socket = ws

  ws.onopen = () => emitStatus('connected')

  ws.onclose = () => {
    socket = null
    if (intentionalClose) {
      emitStatus('disconnected')
      return
    }
    emitStatus('connecting')
    reconnectTimer = setTimeout(openSocket, 2500)
  }

  ws.onerror = () => undefined

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data as string)
      if (payload.type === 'error') return
      if (payload.type === 'message' && payload.message) {
        const msg = payload.message as InboundChatMessage
        const uid = useAuthStore.getState().user?.id
        if (uid) useMessagesStore.getState().handleInbound(msg, uid)
        messageListeners.forEach((fn) => fn(msg))
      }
    } catch {
      /* ignore */
    }
  }
}

export const messagesSocket = {
  connect() {
    intentionalClose = false
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return
    openSocket()
  },

  disconnect() {
    intentionalClose = true
    clearReconnect()
    socket?.close()
    socket = null
    emitStatus('disconnected')
    useMessagesStore.getState().setActiveThreadContactId(null)
    useMessagesStore.setState({ unreadByContactId: {} })
  },

  send(data: object) {
    if (socket?.readyState !== WebSocket.OPEN) return false
    try {
      socket.send(JSON.stringify(data))
      return true
    } catch {
      return false
    }
  },

  subscribeMessages(fn: MessageListener) {
    messageListeners.add(fn)
    return () => messageListeners.delete(fn)
  },

  subscribeStatus(fn: StatusListener) {
    statusListeners.add(fn)
    fn(publicStatus)
    return () => statusListeners.delete(fn)
  },

  getSocket() {
    return socket
  },
}
