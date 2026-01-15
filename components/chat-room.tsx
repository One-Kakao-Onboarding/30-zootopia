"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, MoreVertical, Sparkles, Zap, LogOut, Loader2, Smile, Heart, Briefcase, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatPreview } from "@/app/page"
import { useSettings } from "@/app/page"
import { AIReplyModal } from "@/components/ai-reply-modal"
import { RelationshipModal } from "@/components/relationship-modal"
import { SettingsModal } from "@/components/settings-tab"
import {
  messageApi,
  aiApi,
  type MessageResponse,
  type AIReplyResponse
} from "@/lib/api"

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

const eventKeywords = {
  wedding: ["결혼", "결혼해", "청첩장", "식 올려", "웨딩"],
  birthday: ["생일", "생파", "생일 축하"],
  funeral: ["부고", "돌아가", "장례"],
  reunion: ["오랜만", "연락 안 했", "잘 지냈"],
}

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
    polite: "응 알겠어!",
    friendly: "ㅇㅋㅇㅋ!!",
    formal: "네, 알겠습니다.",
  },
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

function convertToMessage(msg: MessageResponse, currentUserId: string): Message {
  return {
    id: msg.id.toString(),
    content: msg.content,
    sender: msg.senderId.toString() === currentUserId ? "me" : "other",
    timestamp: formatTimestamp(msg.createdAt),
    event: msg.eventDetected && msg.eventType ? {
      type: msg.eventType as "wedding" | "birthday" | "funeral" | "reunion" | "general",
      detected: true
    } : undefined,
    insight: msg.aiInsight || undefined,
    isAutoReply: msg.isAutoReply,
  }
}

export function ChatRoom({ chat, onBack, onLeaveChat }: ChatRoomProps) {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [aiReplies, setAiReplies] = useState<AIReplyResponse | null>(null)
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Message["event"] | null>(null)
  const [pendingAutoReply, setPendingAutoReply] = useState<{ event?: Message["event"]; show: boolean } | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [detectedEvent, setDetectedEvent] = useState<keyof typeof autoReplyOptions | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load messages from API
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const chatRoomId = parseInt(chat.id)
        const apiMessages = await messageApi.getAllMessages(chatRoomId)
        const userId = localStorage.getItem('userId') || ''

        const convertedMessages = apiMessages.map(msg => convertToMessage(msg, userId))
        setMessages(convertedMessages)
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    // Poll for new messages every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const chatRoomId = parseInt(chat.id)
        const apiMessages = await messageApi.getAllMessages(chatRoomId)
        const userId = localStorage.getItem('userId') || ''
        const convertedMessages = apiMessages.map(msg => convertToMessage(msg, userId))
        setMessages(convertedMessages)
      } catch (error) {
        console.error('Failed to poll messages:', error)
      }
    }, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [chat.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Detect events from messages
  useEffect(() => {
    const lastOtherMessage = [...messages].reverse().find((m) => m.sender === "other")
    if (!lastOtherMessage) return

    // Check if event already detected from backend
    if (lastOtherMessage.event?.detected) {
      setDetectedEvent(lastOtherMessage.event.type)
      setShowAIPanel(true)
      return
    }

    // Client-side event detection fallback
    for (const [event, keywords] of Object.entries(eventKeywords)) {
      if (keywords.some((keyword) => lastOtherMessage.content.includes(keyword))) {
        setDetectedEvent(event as keyof typeof autoReplyOptions)
        setShowAIPanel(true)
        break
      }
    }
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

  // Auto-reply check
  useEffect(() => {
    if (settings.replyMode === "auto" && chat.intimacyScore !== undefined) {
      const eventMessage = messages.find((m) => m.event?.detected)
      const hasMyReply = messages.some((m) => m.sender === "me")

      if (eventMessage && chat.intimacyScore <= settings.autoReplyThreshold && !hasMyReply) {
        setPendingAutoReply({ event: eventMessage.event, show: true })
      }
    }
  }, [settings.replyMode, settings.autoReplyThreshold, chat.intimacyScore, messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value === "@" || value.startsWith("@카톡사이")) {
      setShowCommandMenu(true)
    } else {
      setShowCommandMenu(false)
    }
  }

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue
    if (!messageContent.trim() || isSending) return

    setIsSending(true)
    try {
      const chatRoomId = parseInt(chat.id)
      await messageApi.sendMessage(chatRoomId, {
        content: messageContent,
        type: 'TEXT',
      })

      setInputValue("")
      setShowCommandMenu(false)
      setPendingAutoReply(null)
      setShowAIPanel(false)

      // Refresh messages
      const apiMessages = await messageApi.getAllMessages(chatRoomId)
      const userId = localStorage.getItem('userId') || ''
      setMessages(apiMessages.map(msg => convertToMessage(msg, userId)))
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleAutoReply = async () => {
    if (!detectedEvent) return

    const tone = settings.defaultTone
    const replyText = autoReplyOptions[detectedEvent][tone]

    setIsSending(true)
    try {
      const chatRoomId = parseInt(chat.id)
      await messageApi.sendMessage(chatRoomId, {
        content: replyText,
        type: 'TEXT',
        isAutoReply: true
      })

      // Refresh messages
      const apiMessages = await messageApi.getAllMessages(chatRoomId)
      const userId = localStorage.getItem('userId') || ''
      setMessages(apiMessages.map(msg => convertToMessage(msg, userId)))
      setPendingAutoReply(null)
      setShowAIPanel(false)
    } catch (error) {
      console.error('Failed to send auto reply:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleGenerateReply = async (event?: Message["event"]) => {
    setSelectedEvent(event || null)

    // Try to generate AI reply from backend
    try {
      const chatRoomId = parseInt(chat.id)
      const friendId = 1 // This should come from the chat member data
      const eventType = event?.type || detectedEvent || 'general'

      const response = await aiApi.generateReply({
        chatRoomId,
        friendId,
        eventType
      })
      setAiReplies(response)
    } catch (error) {
      console.error('Failed to generate AI reply:', error)
      setAiReplies(null)
    }

    setShowReplyModal(true)
    setPendingAutoReply(null)
    setShowAIPanel(false)
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
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
          {chat.intimacyScore !== undefined && (
            <p className="text-xs text-muted-foreground">친밀도: {chat.intimacyScore}점</p>
          )}
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
        {messages.length === 0 ? (
          <div className="bg-accent/50 rounded-xl p-3 text-center text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 inline-block mr-1 text-primary" />
            아직 대화가 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          <div className="bg-accent/50 rounded-xl p-3 text-center text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 inline-block mr-1 text-primary" />
            {messages.length}개의 메시지가 있습니다
          </div>
        )}

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
                  {message.isAutoReply && <span className="ml-1 text-primary">⚡</span>}
                </p>
              </div>
            </div>
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
              <Button onClick={handleAutoReply} className="flex-1 bg-primary hover:bg-primary/90" size="sm" disabled={isSending}>
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

      {/* AI Panel for event detection */}
      {showAIPanel && detectedEvent && !pendingAutoReply?.show && (
        <div className="bg-card border-t border-border animate-in slide-in-from-bottom duration-300">
          {/* Event Detection Header */}
          <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {settings.replyMode === "auto" ? (
                  <Zap className="w-4 h-4 text-primary" />
                ) : (
                  <Sparkles className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {detectedEvent === "wedding" && "결혼 이벤트 감지됨"}
                  {detectedEvent === "birthday" && "생일 이벤트 감지됨"}
                  {detectedEvent === "funeral" && "부고 이벤트 감지됨"}
                  {detectedEvent === "reunion" && "오랜만의 연락 감지됨"}
                  {detectedEvent === "general" && "메시지 감지됨"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.replyMode === "auto" ? "자동 답장이 준비되었습니다" : "AI 추천 답장을 선택해주세요"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowAIPanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggest Mode: Show multiple options */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => handleSendMessage(autoReplyOptions[detectedEvent].polite)}
              className="w-full p-3 bg-secondary hover:bg-accent rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Smile className="w-3 h-3 text-green-600" />
                </div>
                <span className="font-medium text-xs text-foreground">정중한 타입</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{autoReplyOptions[detectedEvent].polite}</p>
            </button>

            <button
              onClick={() => handleSendMessage(autoReplyOptions[detectedEvent].friendly)}
              className="w-full p-3 bg-secondary hover:bg-accent rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                  <Heart className="w-3 h-3 text-pink-600" />
                </div>
                <span className="font-medium text-xs text-foreground">친근한 타입</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{autoReplyOptions[detectedEvent].friendly}</p>
            </button>

            <button
              onClick={() => handleSendMessage(autoReplyOptions[detectedEvent].formal)}
              className="w-full p-3 bg-secondary hover:bg-accent rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                </div>
                <span className="font-medium text-xs text-foreground">공식적 타입</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{autoReplyOptions[detectedEvent].formal}</p>
            </button>

            <button
              onClick={() => handleGenerateReply()}
              className="w-full p-3 bg-primary/10 hover:bg-primary/20 rounded-xl text-left transition-colors border border-primary/20"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm text-primary">AI로 더 맞춤 답장 생성하기</span>
              </div>
            </button>
          </div>

          {/* Money Guide for special events */}
          {(detectedEvent === "wedding" || detectedEvent === "funeral") && (
            <div className="px-4 pb-4">
              <div className="bg-accent/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  💡{" "}
                  {detectedEvent === "wedding"
                    ? "축의금 가이드: 이 관계면 5만원이 적당해요"
                    : "조의금 가이드: 이 관계면 3만원이 적당해요"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Command Menu */}
      {showCommandMenu && (
        <div className="bg-card border-t border-border p-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCommandSelect("generate")}
              className="rounded-full"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI 답장 생성
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCommandSelect("rank")}
              className="rounded-full"
            >
              관계 대시보드
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCommandSelect("settings")}
              className="rounded-full"
            >
              설정
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      {!showAIPanel && (
        <div className="bg-card border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="@카톡사이 입력하여 AI 도움받기"
              className="flex-1 bg-secondary border-0 rounded-full px-4"
              disabled={isSending}
            />
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
              disabled={isSending}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* AI Reply Modal */}
      <AIReplyModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        onSelectReply={handleSelectReply}
        eventType={selectedEvent?.type || detectedEvent}
        aiReplies={aiReplies}
      />

      {/* Relationship Modal */}
      <RelationshipModal isOpen={showRelationshipModal} onClose={() => setShowRelationshipModal(false)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  )
}
