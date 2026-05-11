import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useMessagesStore, type InboundChatMessage } from '@/stores/messagesStore'
import { messagesSocket } from '@/lib/messagesSocket'
import { messagesApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDateTime, resolveApiAssetUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { Mail, MessageSquare, Send, Users } from 'lucide-react'

interface Contact {
  id: number
  full_name: string
  email: string
  role: 'trainee' | 'instructor' | 'admin'
  avatar_url?: string
}

interface ChatMessage {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  created_at: string
  sender: Contact
  recipient: Contact
}

const roleBadgeStyles: Record<string, string> = {
  trainee: 'bg-[#6C63FF15] text-[#6C63FF] border-[#6C63FF30]',
  instructor: 'bg-[#00D4FF15] text-[#00D4FF] border-[#00D4FF30]',
  admin: 'bg-[#FFB83015] text-[#FFB830] border-[#FFB83030]',
}

function appendMessageDeduped(prev: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (prev.some((m) => m.id === message.id)) return prev
  return [...prev, message]
}

export function MessagesPage() {
  const { user } = useAuthStore()
  const unreadByContactId = useMessagesStore((s) => s.unreadByContactId)
  const clearUnread = useMessagesStore((s) => s.clearUnread)
  const setActiveThreadContactId = useMessagesStore((s) => s.setActiveThreadContactId)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const totalUnreadCount = useMemo(
    () => Object.values(unreadByContactId).reduce((acc, n) => acc + (n > 0 ? n : 0), 0),
    [unreadByContactId]
  )

  const headerUnreadElsewhere = useMemo(() => {
    if (!selectedContactId) return totalUnreadCount
    let t = 0
    for (const [k, v] of Object.entries(unreadByContactId)) {
      if (Number(k) === selectedContactId) continue
      if (v > 0) t += v
    }
    return t
  }, [unreadByContactId, selectedContactId, totalUnreadCount])

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const selectedContactRef = useRef<number | null>(null)
  const userIdRef = useRef<number | null>(null)

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  )

  useEffect(() => {
    selectedContactRef.current = selectedContactId
    setActiveThreadContactId(selectedContactId)
    return () => setActiveThreadContactId(null)
  }, [selectedContactId, setActiveThreadContactId])

  useEffect(() => {
    userIdRef.current = user?.id ?? null
  }, [user])

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await messagesApi.getContacts()
        setContacts(response.data)
        setFilteredContacts(response.data)
        if (response.data.length && selectedContactId === null) {
          setSelectedContactId(response.data[0].id)
        }
      } catch {
        toast.error('Failed to load contacts')
      } finally {
        setIsLoadingContacts(false)
      }
    }

    loadContacts()
  }, [])

  useEffect(() => {
    if (!search) {
      setFilteredContacts(contacts)
      return
    }
    const term = search.toLowerCase()
    setFilteredContacts(
      contacts.filter((contact) =>
        contact.full_name.toLowerCase().includes(term) || contact.email.toLowerCase().includes(term)
      )
    )
  }, [search, contacts])

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedContactId) return
      setIsLoadingHistory(true)
      try {
        const response = await messagesApi.getHistory(selectedContactId)
        setMessages(response.data)
      } catch {
        toast.error('Failed to load conversation')
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
    if (selectedContactId) clearUnread(selectedContactId)
  }, [selectedContactId, clearUnread])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const unsubStatus = messagesSocket.subscribeStatus((s) => setSocketStatus(s))
    return unsubStatus
  }, [])

  useEffect(() => {
    const handleInbound = (message: InboundChatMessage) => {
      const currentUserId = userIdRef.current
      if (!currentUserId) return

      const otherUserId = message.sender_id === currentUserId ? message.recipient_id : message.sender_id
      const isActive = selectedContactRef.current === otherUserId

      if (isActive) {
        setMessages((prev) => appendMessageDeduped(prev, message as ChatMessage))
      }
    }

    return messagesSocket.subscribeMessages(handleInbound)
  }, [])

  const handleSend = async () => {
    if (!selectedContact) return
    const content = draft.trim()
    if (!content) return

    const payload = { recipient_id: selectedContact.id, content }

    if (messagesSocket.send(payload)) {
      setDraft('')
      return
    }

    setDraft('')
    setIsSending(true)
    try {
      const response = await messagesApi.sendMessage(payload)
      setMessages((prev) => appendMessageDeduped(prev, response.data))
    } catch {
      toast.error('Failed to send message')
      setDraft(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectContact = (contactId: number) => {
    setSelectedContactId(contactId)
    clearUnread(contactId)
  }

  const panelHeightClass =
    'h-[min(380px,calc(100dvh-15rem))] sm:h-[min(440px,calc(100dvh-14rem))] lg:h-[min(620px,calc(100dvh-12rem))]'

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-[#F0F0FF]">Messages</h1>
          {totalUnreadCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#FF4D6D40] bg-[#FF4D6D12] px-2 py-0.5 text-xs font-medium text-[#FF8A9E]">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {totalUnreadCount} unread
            </span>
          )}
        </div>
        <p className="text-pretty text-[#8888AA]">Private chat with instructors, admins, and trainees.</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] lg:items-stretch lg:gap-6">
        <Card className="flex min-h-0 flex-col overflow-hidden border-[#1E1E2E]">
          <CardHeader className="shrink-0 space-y-1 pb-2">
            <CardTitle className="flex items-center gap-2 text-[#F0F0FF]">
              <Users className="h-4 w-4 shrink-0 text-[#6C63FF]" />
              Contacts
            </CardTitle>
            <CardDescription className="text-pretty">Search and pick someone to message.</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-col gap-3 px-6 pb-6 pt-0">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="shrink-0"
            />
            <ScrollArea className={`min-h-0 w-full pr-2 ${panelHeightClass}`}>
              {isLoadingContacts ? (
                <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                  Loading contacts...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                  No contacts found.
                </div>
              ) : (
                <ul className="flex flex-col gap-2 pb-1">
                  {filteredContacts.map((contact) => {
                    const isActive = contact.id === selectedContactId
                    const unread = unreadByContactId[contact.id] || 0
                    return (
                      <li key={contact.id} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => handleSelectContact(contact.id)}
                          className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                            isActive
                              ? 'border-[#6C63FF] bg-[#6C63FF12] shadow-[0_0_0_1px_rgba(108,99,255,0.25)]'
                              : 'border-[#1E1E2E] bg-[#0A0A0F] hover:border-[#6C63FF50]'
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="relative shrink-0">
                              <Avatar className="h-10 w-10 ring-1 ring-[#1E1E2E]">
                                <AvatarImage src={resolveApiAssetUrl(contact.avatar_url)} />
                                <AvatarFallback className="text-xs">
                                  {contact.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {unread > 0 && (
                                <span
                                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D6D] px-1 text-[10px] font-bold text-white ring-2 ring-[#0A0A0F]"
                                  aria-label={`${unread} unread`}
                                >
                                  {unread > 9 ? '9+' : unread}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="break-words text-sm font-semibold leading-snug text-[#F0F0FF]">
                                  {contact.full_name}
                                </p>
                              </div>
                              <p className="break-all text-xs leading-snug text-[#8888AA]">{contact.email}</p>
                            </div>
                          </div>
                          <Badge className={`w-fit shrink-0 border text-[10px] uppercase ${roleBadgeStyles[contact.role]}`}>
                            {contact.role}
                          </Badge>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden border-[#1E1E2E]">
          <CardHeader className="shrink-0 space-y-2 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="flex flex-wrap items-center gap-2 break-words text-[#F0F0FF]">
                  <MessageSquare className="h-4 w-4 shrink-0 text-[#00D4FF]" />
                  {selectedContact ? selectedContact.full_name : 'Select a contact'}
                  {headerUnreadElsewhere > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border border-[#6C63FF30] bg-[#6C63FF10] px-2 py-0.5 text-xs font-normal text-[#B8B3FF]"
                      title="Unread messages in other conversations"
                    >
                      <Mail className="h-3 w-3" />
                      {headerUnreadElsewhere} other
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="break-all">
                  {selectedContact ? selectedContact.email : 'Choose someone to start messaging.'}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 ${
                  socketStatus === 'connected'
                    ? 'border-[#00C896] text-[#00C896]'
                    : socketStatus === 'connecting'
                      ? 'border-[#FFB830] text-[#FFB830]'
                      : 'border-[#FF4D6D] text-[#FF4D6D]'
                }`}
              >
                {socketStatus === 'connected' ? 'Live' : socketStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-0">
            <ScrollArea className={`min-h-0 w-full flex-1 pr-2 ${panelHeightClass}`}>
              {isLoadingHistory ? (
                <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                  Loading conversation...
                </div>
              ) : selectedContact ? (
                <div className="space-y-4 pb-2">
                  {messages.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                      No messages yet. Say hello.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === user?.id
                      const senderName = message.sender?.full_name || 'Unknown'
                      return (
                        <div
                          key={message.id}
                          className={`flex min-w-0 ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[min(100%,28rem)] rounded-xl border px-4 py-3 text-sm ${
                              isMine
                                ? 'border-[#6C63FF35] bg-[#6C63FF12] text-[#F0F0FF]'
                                : 'border-[#1E1E2E] bg-[#0A0A0F] text-[#E6E6FF]'
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#8888AA]">
                              <span className="font-medium">{isMine ? 'You' : senderName}</span>
                              <span aria-hidden>•</span>
                              <span>{formatDateTime(message.created_at)}</span>
                            </div>
                            <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={scrollAnchorRef} className="h-px shrink-0" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                  Select a contact to view messages.
                </div>
              )}
            </ScrollArea>

            <div className="shrink-0 flex flex-col gap-3 border-t border-[#1E1E2E] pt-4 sm:flex-row sm:items-end">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={selectedContact ? `Message ${selectedContact.full_name}` : 'Select a contact'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                disabled={!selectedContact}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                loading={isSending}
                disabled={!selectedContact || !draft.trim()}
                className="shrink-0 gap-2 sm:min-w-[120px]"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
