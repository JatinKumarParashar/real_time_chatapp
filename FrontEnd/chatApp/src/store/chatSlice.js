import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentUser: null,
  contacts: [
    {
      id: 'c1',
      name: 'Priya Jain',
      status: 'online',
      avatar: 'PJ',
      lastSeen: 'Just now',
      unread: 3,
      messages: [
        { id: 1, text: 'Hey! Are we still meeting today?', sender: 'them', time: '09:12' },
        { id: 2, text: 'Yes, see you in 30 minutes.', sender: 'me', time: '09:13' },
        { id: 3, text: 'Perfect! I will bring the deck.', sender: 'them', time: '09:14' },
      ],
    },
    {
      id: 'c2',
      name: 'Team Alpha',
      status: 'last seen 3m ago',
      avatar: 'TA',
      lastSeen: '3m ago',
      unread: 0,
      messages: [
        { id: 1, text: 'Design review updated with the new mockups.', sender: 'them', time: '08:45' },
        { id: 2, text: 'Looks good. Let’s share it with PM.', sender: 'me', time: '08:47' },
      ],
    },
    {
      id: 'c3',
      name: 'Aisha Khan',
      status: 'typing...',
      avatar: 'AK',
      lastSeen: 'typing',
      unread: 1,
      messages: [
        { id: 1, text: 'Can you review the landing page copy?', sender: 'them', time: 'Yesterday' },
      ],
    },
  ],
  activeChatId: 'c1',
  search: '',
  draftMessage: '',
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload
    },
    setSearch: (state, action) => {
      state.search = action.payload
    },
    setDraftMessage: (state, action) => {
      state.draftMessage = action.payload
    },
    sendMessage: (state) => {
      const activeContact = state.contacts.find((contact) => contact.id === state.activeChatId)
      if (!activeContact || !state.draftMessage.trim()) return

      activeContact.messages.push({
        id: Date.now(),
        text: state.draftMessage.trim(),
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
      activeContact.unread = 0
      state.draftMessage = ''
    },
    loginUser: (state, action) => {
      state.currentUser = action.payload
    },
    logoutUser: (state) => {
      state.currentUser = null
    },
  },
})

export const {
  setActiveChat,
  setSearch,
  setDraftMessage,
  sendMessage,
  loginUser,
  logoutUser,
} = chatSlice.actions

export default chatSlice.reducer
