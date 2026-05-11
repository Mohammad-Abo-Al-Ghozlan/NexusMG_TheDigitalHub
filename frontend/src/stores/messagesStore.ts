import { create } from 'zustand'

/** Active DM thread partner id (set by Messages page); used to avoid counting read messages as unread. */
export interface InboundChatMessage {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  created_at: string
}

interface MessagesState {
  activeThreadContactId: number | null
  unreadByContactId: Record<number, number>
  setActiveThreadContactId: (id: number | null) => void
  /** Call from global socket when any inbound message arrives. */
  handleInbound: (message: InboundChatMessage, currentUserId: number) => void
  clearUnread: (contactId: number) => void
}

export const useMessagesStore = create<MessagesState>((set) => ({
  activeThreadContactId: null,
  unreadByContactId: {},

  setActiveThreadContactId: (id) => set({ activeThreadContactId: id }),

  handleInbound: (message, currentUserId) =>
    set((s) => {
      const other =
        message.sender_id === currentUserId ? message.recipient_id : message.sender_id
      if (s.activeThreadContactId === other) return s
      return {
        unreadByContactId: {
          ...s.unreadByContactId,
          [other]: (s.unreadByContactId[other] || 0) + 1,
        },
      }
    }),

  clearUnread: (contactId) =>
    set((s) => ({
      unreadByContactId: { ...s.unreadByContactId, [contactId]: 0 },
    })),
}))
