"use client"

import { useState, createContext, useContext } from "react"
import { ChatList } from "@/components/chat-list"
import { ChatRoom } from "@/components/chat-room"
import { FriendsList } from "@/components/friends-list"
import { SettingsTab } from "@/components/settings-tab"
import { LoginScreen } from "@/components/login-screen"
import { MessageCircle, Users, Settings } from "lucide-react"

export interface AppSettings {
  replyMode: "auto" | "suggest"
  autoReplyThreshold: number
  defaultTone: "polite" | "friendly" | "formal"
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
}

export const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error("useSettings must be used within SettingsProvider")
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

const initialChats: ChatPreview[] = [
  {
    id: "1",
    name: "김민지",
    avatar: "/korean-woman-profile.png",
    lastMessage: "다음 달 15일에 식 올리는데 와줄 수 있어?",
    timestamp: "14:33",
    unread: 2,
    intimacyScore: 23,
  },
  {
    id: "2",
    name: "이준호",
    avatar: "/korean-man-casual.png",
    lastMessage: "오늘 저녁에 시간 되면 밥 먹자!",
    timestamp: "12:15",
    unread: 1,
    intimacyScore: 87,
  },
  {
    id: "3",
    name: "회사 동료들",
    avatar: "/group-office-team.jpg",
    lastMessage: "내일 회의 10시에 있습니다",
    timestamp: "어제",
    unread: 5,
  },
  {
    id: "4",
    name: "박서연",
    avatar: "/korean-woman-glasses.jpg",
    lastMessage: "고마워! 다음에 커피 살게",
    timestamp: "어제",
    intimacyScore: 65,
  },
  {
    id: "5",
    name: "정유나",
    avatar: "/korean-woman-smile.jpg",
    lastMessage: "사진 잘 받았어 😊",
    timestamp: "월요일",
    unread: 3,
    intimacyScore: 91,
  },
]

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"friends" | "chats" | "settings">("friends")
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null)
  const [chats, setChats] = useState<ChatPreview[]>(initialChats)

  const [settings, setSettings] = useState<AppSettings>({
    replyMode: "suggest",
    autoReplyThreshold: 20,
    defaultTone: "polite",
  })

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const handleLogin = (userId: string) => {
    setCurrentUser(userId)
    setIsLoggedIn(true)
  }

  const handleSelectChat = (chat: ChatPreview) => {
    const updatedChat = { ...chat, unread: 0 }
    setChats((prevChats) => prevChats.map((c) => (c.id === chat.id ? updatedChat : c)))
    setSelectedChat(updatedChat)
  }

  const handleLeaveChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((c) => c.id !== chatId))
  }

  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (selectedChat) {
    return (
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
          <ChatRoom chat={selectedChat} onBack={() => setSelectedChat(null)} onLeaveChat={handleLeaveChat} />
        </div>
      </SettingsContext.Provider>
    )
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === "friends" && <FriendsList onSelectChat={handleSelectChat} />}
          {activeTab === "chats" && (
            <ChatList chats={chats} onSelectChat={handleSelectChat} onLeaveChat={handleLeaveChat} />
          )}
          {activeTab === "settings" && <SettingsTab />}
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
  )
}
