"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, MoreVertical, Sparkles, Zap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CommandMenu } from "@/components/command-menu"
import { EventDetectionCard } from "@/components/event-detection-card"
import { AIReplyModal } from "@/components/ai-reply-modal"
import { AIInsightChip } from "@/components/ai-insight-chip"
import { RelationshipModal } from "@/components/relationship-modal"
import { SettingsModal } from "@/components/settings-modal"
import type { ChatPreview } from "@/app/page"
import { useSettings } from "@/app/page"

interface ChatRoomProps {
  chat: ChatPreview
  onBack: () => void
  onLeaveChat?: (chatId: string) => void
}

interface Message {
  id: string
  content: string
  sender: "me" | "other"
  timestamp: string
  event?: {
    type: "wedding" | "birthday" | "funeral" | "reunion" | "general"
    detected: boolean
  }
  insight?: string
  isAutoReply?: boolean
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "야 나 결혼해! 💍",
    sender: "other",
    timestamp: "14:32",
    event: { type: "wedding", detected: true },
    insight: "⚠️ 6년 만의 연락입니다. 신중한 답변이 필요합니다.",
  },
  {
    id: "2",
    content: "다음 달 15일에 식 올리는데 와줄 수 있어?",
    sender: "other",
    timestamp: "14:33",
  },
]

const autoReplyOptions = {
  wedding: {
    polite: "와 정말 축하해! 너무 기쁜 소식이다 😊 당연히 갈게! 청첩장 보내줘~",
    friendly: "헐 대박!! 축하해 친구야!! 🎉💕 꼭 갈게 진짜!! 신랑/신부 누구야?!",
    formal: "결혼 축하해. 그날 일정 확인해보고 연락할게.",
  },
  birthday: {
    polite: "생일 축하해! 좋은 하루 보내 🎂",
    friendly: "생일 축하해!! 🎉🎈 올해도 건강하고 행복하자!",
    formal: "생일 축하드립니다. 좋은 한 해 되세요.",
  },
  funeral: {
    polite: "정말 안타깝네. 삼가 고인의 명복을 빕니다.",
    friendly: "많이 힘들겠다... 옆에 있어줄게. 필요한 거 있으면 말해.",
    formal: "깊은 위로의 말씀을 전합니다. 삼가 고인의 명복을 빕니다.",
  },
  reunion: {
    polite: "오랜만이야! 잘 지냈어? 반가워 😊",
    friendly: "헐 진짜 오랜만!! 어떻게 지냈어?! 😄",
    formal: "오랜만이네요. 잘 지내셨나요?",
  },
  general: {
    polite: "응 알겠어! 확인했어 😊",
    friendly: "오키오키!! 👍",
    formal: "네, 확인했습니다.",
  },
}

export function ChatRoom({ chat, onBack, onLeaveChat }: ChatRoomProps) {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Message["event"] | null>(null)
  const [pendingAutoReply, setPendingAutoReply] = useState<{ event: Message["event"]; show: boolean } | null>(null)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false)
      }
    }

    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showOptionsMenu])

  useEffect(() => {
    if (settings.replyMode === "auto" && chat.intimacyScore !== undefined) {
      const eventMessage = messages.find((m) => m.event?.detected)
      const hasMyReply = messages.some((m) => m.sender === "me")

      if (eventMessage && chat.intimacyScore <= settings.autoReplyThreshold && !hasMyReply) {
        setPendingAutoReply({ event: eventMessage.event, show: true })
      }
    }
  }, [settings.replyMode, settings.autoReplyThreshold, chat.intimacyScore, messages])

  const handleAutoReply = () => {
    if (!pendingAutoReply?.event) return

    const eventType = pendingAutoReply.event.type
    const tone = settings.defaultTone
    const replyText = autoReplyOptions[eventType][tone]

    const newMessage: Message = {
      id: Date.now().toString(),
      content: replyText,
      sender: "me",
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      isAutoReply: true,
    }

    setMessages([...messages, newMessage])
    setPendingAutoReply(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value.includes("@카톡사이")) {
      setShowCommandMenu(true)
    } else {
      setShowCommandMenu(false)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "me",
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setInputValue("")
    setShowCommandMenu(false)
    setPendingAutoReply(null)
  }

  const handleGenerateReply = (event?: Message["event"]) => {
    setSelectedEvent(event || null)
    setShowReplyModal(true)
    setPendingAutoReply(null)
  }

  const handleSelectReply = (reply: string) => {
    setInputValue(reply)
    setShowReplyModal(false)
    inputRef.current?.focus()
  }

  const handleCommandSelect = (command: string) => {
    setShowCommandMenu(false)
    setInputValue("")

    if (command === "generate") {
      const eventMessage = messages.find((m) => m.event?.detected)
      handleGenerateReply(eventMessage?.event)
    } else if (command === "rank") {
      setShowRelationshipModal(true)
    } else if (command === "settings") {
      setShowSettingsModal(true)
    }
  }

  const handleLeaveChat = () => {
    if (onLeaveChat) {
      onLeaveChat(chat.id)
      onBack()
    }
    setShowOptionsMenu(false)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={chat.avatar || "/placeholder.svg"} />
          <AvatarFallback>{chat.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{chat.name}</h1>
          <p className="text-xs text-muted-foreground">마지막 대화: 2019년 5월</p>
        </div>
        <div className="relative" ref={optionsMenuRef}>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
            <MoreVertical className="w-5 h-5" />
          </Button>

          {showOptionsMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handleLeaveChat}
                className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                나가기
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-secondary/30">
        {/* History Summary Card */}
        <div className="bg-accent/50 rounded-xl p-3 text-center text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 inline-block mr-1 text-primary" />
          2019년 5월에 마지막으로 &apos;교양 과제&apos; 대화를 나눴습니다
        </div>

        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
              {message.sender === "other" && (
                <Avatar className="w-8 h-8 mr-2 shrink-0">
                  <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="max-w-[75%]">
                {message.isAutoReply && (
                  <div className="flex items-center gap-1 mb-1 justify-end">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">자동 답장</span>
                  </div>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl ${
                    message.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <p
                  className={`text-xs text-muted-foreground mt-1 ${
                    message.sender === "me" ? "text-right" : "text-left"
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>

            {/* AI Insight Chip */}
            {message.insight && <AIInsightChip message={message.insight} />}

            {/* Event Detection Card */}
            {message.event?.detected && (
              <EventDetectionCard
                eventType={message.event.type}
                onGenerateReply={() => handleGenerateReply(message.event)}
                replyMode={settings.replyMode}
              />
            )}
          </div>
        ))}

        {pendingAutoReply?.show && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">자동 답장 대기 중</p>
                <p className="text-xs text-muted-foreground">
                  친밀도 {chat.intimacyScore}점 -{" "}
                  {settings.defaultTone === "polite"
                    ? "정중한"
                    : settings.defaultTone === "friendly"
                      ? "친근한"
                      : "공식적"}{" "}
                  어조로 답장됩니다
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAutoReply} className="flex-1 bg-primary hover:bg-primary/90" size="sm">
                <Zap className="w-4 h-4 mr-1" />
                자동 답장 보내기
              </Button>
              <Button
                onClick={() => {
                  setPendingAutoReply(null)
                  handleGenerateReply(pendingAutoReply.event)
                }}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                직접 선택하기
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Command Menu */}
      {showCommandMenu && <CommandMenu onSelect={handleCommandSelect} onClose={() => setShowCommandMenu(false)} />}

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="@카톡사이 입력하여 AI 도움받기"
            className="flex-1 bg-secondary border-0 rounded-full px-4"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Reply Modal */}
      <AIReplyModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        onSelectReply={handleSelectReply}
        eventType={selectedEvent?.type}
      />

      {/* Relationship Modal */}
      <RelationshipModal isOpen={showRelationshipModal} onClose={() => setShowRelationshipModal(false)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  )
}
