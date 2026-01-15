"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { ChatList } from "@/components/chat-list"
import { ChatRoom } from "@/components/chat-room"
import { FriendsList } from "@/components/friends-list"
import { SettingsTab } from "@/components/settings-tab"
import { LoginScreen } from "@/components/login-screen"
import { MessageCircle, Users, Settings, Loader2 } from "lucide-react"
import {
  chatRoomApi,
  userApi,
  getSession,
  clearSession,
  type ChatRoomResponse,
  type UserSettings,
  type LoginResponse
} from "@/lib/api"

export interface AppSettings {
  replyMode: "auto" | "suggest"
  autoReplyThreshold: number
  defaultTone: "polite" | "friendly" | "formal"
}

interface UserContextType {
  user: LoginResponse | null
  userId: string | null
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  saveSettings: () => Promise<void>
}

export const SettingsContext = createContext<SettingsContextType | null>(null)
export const UserContext = createContext<UserContextType | null>(null)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error("useSettings must be used within SettingsProvider")
  return context
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used within UserProvider")
  return context
}

export interface ChatPreview {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread?: number
  intimacyScore?: number
}

export interface Friend {
  id: string
  name: string
  avatar: string
  statusMessage?: string
  intimacyScore: number
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return days[date.getDay()]
  } else {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }
}

function convertToChatPreview(chatRoom: ChatRoomResponse): ChatPreview {
  return {
    id: chatRoom.id.toString(),
    name: chatRoom.name,
    avatar: chatRoom.avatar || '/default-avatar.png',
    lastMessage: chatRoom.lastMessage || '',
    timestamp: chatRoom.lastMessageAt ? formatTimestamp(chatRoom.lastMessageAt) : '',
    unread: chatRoom.unreadCount,
    intimacyScore: chatRoom.intimacyScore,
  }
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"friends" | "chats" | "settings">("friends")
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null)
  const [chats, setChats] = useState<ChatPreview[]>([])

  const [settings, setSettings] = useState<AppSettings>({
    replyMode: "suggest",
    autoReplyThreshold: 20,
    defaultTone: "polite",
  })

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const session = getSession()
      if (session.userId && session.token) {
        setUserId(session.userId)
        setIsLoggedIn(true)
        try {
          // Load settings
          const userSettings = await userApi.getSettings()
          setSettings({
            replyMode: userSettings.replyMode,
            autoReplyThreshold: userSettings.autoReplyThreshold,
            defaultTone: userSettings.defaultTone,
          })
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
      setIsLoading(false)
    }
    checkSession()
  }, [])

  // Load chats when logged in
  useEffect(() => {
    const loadChats = async () => {
      if (!isLoggedIn) return
      try {
        const chatRooms = await chatRoomApi.getAll()
        setChats(chatRooms.map(convertToChatPreview))
      } catch (error) {
        console.error('Failed to load chats:', error)
      }
    }
    loadChats()
  }, [isLoggedIn])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const saveSettings = async () => {
    try {
      await userApi.updateSettings({
        replyMode: settings.replyMode.toUpperCase() as 'AUTO' | 'SUGGEST',
        autoReplyThreshold: settings.autoReplyThreshold,
        defaultTone: settings.defaultTone.toUpperCase() as 'POLITE' | 'FRIENDLY' | 'FORMAL',
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleLogin = (loginUserId: string, userData?: LoginResponse) => {
    setUserId(loginUserId)
    if (userData) {
      setCurrentUser(userData)
    }
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    clearSession()
    setIsLoggedIn(false)
    setCurrentUser(null)
    setUserId(null)
    setChats([])
  }

  const handleSelectChat = async (chat: ChatPreview) => {
    const updatedChat = { ...chat, unread: 0 }
    setChats((prevChats) => prevChats.map((c) => (c.id === chat.id ? updatedChat : c)))
    setSelectedChat(updatedChat)

    // Mark as read on backend
    try {
      await chatRoomApi.markAsRead(parseInt(chat.id))
    } catch (error) {
      console.error('Failed to mark chat as read:', error)
    }
  }

  const handleLeaveChat = async (chatId: string) => {
    setChats((prevChats) => prevChats.filter((c) => c.id !== chatId))
    try {
      await chatRoomApi.leave(parseInt(chatId))
    } catch (error) {
      console.error('Failed to leave chat:', error)
    }
  }

  const refreshChats = async () => {
    try {
      const chatRooms = await chatRoomApi.getAll()
      setChats(chatRooms.map(convertToChatPreview))
    } catch (error) {
      console.error('Failed to refresh chats:', error)
    }
  }

  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (selectedChat) {
    return (
      <UserContext.Provider value={{ user: currentUser, userId }}>
        <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
          <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
            <ChatRoom
              chat={selectedChat}
              onBack={() => {
                setSelectedChat(null)
                refreshChats()
              }}
              onLeaveChat={handleLeaveChat}
            />
          </div>
        </SettingsContext.Provider>
      </UserContext.Provider>
    )
  }

  return (
    <UserContext.Provider value={{ user: currentUser, userId }}>
      <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
        <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {activeTab === "friends" && <FriendsList onSelectChat={handleSelectChat} />}
            {activeTab === "chats" && (
              <ChatList chats={chats} onSelectChat={handleSelectChat} onLeaveChat={handleLeaveChat} />
            )}
            {activeTab === "settings" && <SettingsTab onLogout={handleLogout} />}
          </main>

          <nav className="bg-card border-t border-border px-6 py-3 flex justify-around items-center">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === "friends" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">친구</span>
            </button>
            <button
              onClick={() => setActiveTab("chats")}
              className={`relative flex flex-col items-center gap-1 transition-colors ${
                activeTab === "chats" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <MessageCircle className="w-6 h-6" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">채팅</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === "settings" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">설정</span>
            </button>
          </nav>
        </div>
      </SettingsContext.Provider>
    </UserContext.Provider>
  )
}
