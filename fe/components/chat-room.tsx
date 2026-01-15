"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, MoreVertical, Sparkles, LogOut, Loader2, Heart, X } from "lucide-react"
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
import { wsService, type WebSocketMessage } from "@/lib/websocket"

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

const eventTypes = ["wedding", "birthday", "funeral", "reunion", "general"] as const
type EventType = typeof eventTypes[number]

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
  const [loadError, setLoadError] = useState<string | null>(null)
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSendingRef = useRef(false)

  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Message["event"] | null>(null)
  const [currentEventMessageId, setCurrentEventMessageId] = useState<string | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [detectedEvent, setDetectedEvent] = useState<EventType | null>(null)
  const [suggestReplies, setSuggestReplies] = useState<AIReplyResponse | null>(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [repliedEventMessageIds, setRepliedEventMessageIds] = useState<Set<string>>(new Set())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load messages from API and subscribe to WebSocket for real-time updates
  useEffect(() => {
    const chatRoomId = parseInt(chat.id)
    const userId = localStorage.getItem('userNumericId') || ''
    const userNumericId = parseInt(userId) || 0
    let unsubscribe: (() => void) | null = null

    const loadMessages = async () => {
      try {
        setLoadError(null)
        if (isNaN(chatRoomId)) {
          throw new Error('잘못된 채팅방 ID입니다')
        }
        const apiMessages = await messageApi.getAllMessages(chatRoomId)
        const convertedMessages = apiMessages.map(msg => convertToMessage(msg, userId))
        setMessages(convertedMessages)
      } catch (error) {
        console.error('Failed to load messages:', error)
        setLoadError(error instanceof Error ? error.message : '메시지를 불러올 수 없습니다')
      } finally {
        setIsLoading(false)
      }
    }

    const setupWebSocket = async () => {
      try {
        // Connect to WebSocket
        if (userNumericId > 0) {
          await wsService.connect(userNumericId)
          console.log('[WS] Connected, now subscribing to room:', chatRoomId)

          // Subscribe to chat room messages
          unsubscribe = wsService.subscribe(chatRoomId, (wsMessage: WebSocketMessage) => {
            // Convert WebSocket message to our Message format
            const newMessage: Message = {
              id: wsMessage.id.toString(),
              content: wsMessage.content,
              sender: wsMessage.senderId.toString() === userId ? "me" : "other",
              timestamp: formatTimestamp(wsMessage.createdAt),
              event: wsMessage.eventDetected && wsMessage.eventType ? {
                type: wsMessage.eventType as "wedding" | "birthday" | "funeral" | "reunion" | "general",
                detected: true
              } : undefined,
              insight: wsMessage.aiInsight || undefined,
              isAutoReply: wsMessage.isAutoReply,
            }

            // Add message if it doesn't already exist
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === newMessage.id)) {
                return prev
              }
              // Replace temp message with real one if exists
              const tempIndex = prev.findIndex(m =>
                m.id.startsWith('temp-') &&
                m.content === newMessage.content &&
                m.sender === newMessage.sender
              )
              if (tempIndex !== -1) {
                const updated = [...prev]
                updated[tempIndex] = newMessage
                return updated
              }
              return [...prev, newMessage]
            })
          })
        }
      } catch (error) {
        console.error('[WS] Setup failed:', error)
        startPolling()
      }
    }

    const startPolling = () => {
      // Fallback polling only when WebSocket fails
      console.log('[Polling] Starting fallback polling for chat room:', chatRoomId)
      pollingIntervalRef.current = setInterval(async () => {
        if (loadError || isSendingRef.current) return
        try {
          const apiMessages = await messageApi.getAllMessages(chatRoomId)
          const convertedMessages = apiMessages.map(msg => convertToMessage(msg, userId))
          setMessages(convertedMessages)
        } catch (err) {
          console.error('Failed to poll messages:', err)
        }
      }, 500)
    }

    loadMessages()

    // Setup WebSocket for real-time messaging
    setupWebSocket().then(() => {
      console.log('[WebSocket] Real-time messaging enabled')
    }).catch((err) => {
      console.error('[WebSocket] Setup failed, falling back to polling:', err)
      startPolling()
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [chat.id, loadError])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Detect events from messages
  useEffect(() => {
    const lastOtherMessage = [...messages].reverse().find((m) => m.sender === "other")
    if (!lastOtherMessage) return

    let eventType: EventType | null = null

    // Check if event already detected from backend
    if (lastOtherMessage.event?.detected) {
      eventType = lastOtherMessage.event.type
    } else {
      // Client-side event detection fallback
      for (const [event, keywords] of Object.entries(eventKeywords)) {
        if (keywords.some((keyword) => lastOtherMessage.content.includes(keyword))) {
          eventType = event as EventType
          break
        }
      }
    }

    if (eventType) {
      setDetectedEvent(eventType)
      setShowAIPanel(true)
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

    const chatRoomId = parseInt(chat.id)

    // Optimistic UI: Show message immediately (before any async operation)
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender: "me",
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
    setMessages(prev => [...prev, optimisticMessage])
    setInputValue("")
    setShowCommandMenu(false)
    setShowAIPanel(false)
    setSuggestReplies(null)
    setDetectedEvent(null)
    setIsSending(true)
    isSendingRef.current = true

    // Send to server in background
    messageApi.sendMessage(chatRoomId, {
      content: messageContent,
      type: 'TEXT',
    }).then(response => {
      // Just update the temp ID to real ID - keep the optimistic message visible
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, id: response.id.toString() } : msg
      ))
    }).catch(error => {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
    }).finally(() => {
      setIsSending(false)
      // Small delay before re-enabling polling to avoid race conditions
      setTimeout(() => {
        isSendingRef.current = false
      }, 100)
    })
  }

  const handleGenerateReply = async (event?: Message["event"], messageId?: string) => {
    setSelectedEvent(event || null)
    setCurrentEventMessageId(messageId || null)

    // Try to generate AI reply from backend
    try {
      const chatRoomId = parseInt(chat.id)
      const currentUserId = localStorage.getItem('userNumericId')
      const friendId = chat.members?.find(m => m.id.toString() !== currentUserId)?.id || 1
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
    setShowAIPanel(false)
    setSuggestReplies(null)
  }

  const handleSelectReply = (reply: string) => {
    // AI 답장 선택 시 해당 이벤트 메시지를 replied로 표시
    if (currentEventMessageId) {
      setRepliedEventMessageIds(prev => new Set([...prev, currentEventMessageId]))
    }
    setCurrentEventMessageId(null)
    setShowReplyModal(false)
    // 텍스트필드에 표시 (사용자가 확인/수정 후 전송)
    setInputValue(reply)
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

  if (loadError) {
    return (
      <div className="flex flex-col h-screen">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">{chat.name}</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <X className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>
            돌아가기
          </Button>
        </div>
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

        {messages.map((message, index) => (
          <div key={message.id}>
            {/* 메시지 버블 */}
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

            {/* 이벤트 감지 인라인 카드 - 상대방 메시지에서 이벤트가 감지된 경우 */}
            {/* AI를 통해 답장한 경우에만 카드 숨김 */}
            {message.sender === "other" && message.event?.detected &&
             !repliedEventMessageIds.has(message.id) && (
              <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* AI 인사이트 배너 */}
                {message.insight && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                    <span className="text-amber-600 text-sm">⚠️ {message.insight}</span>
                  </div>
                )}

                {/* AI 감지 카드 */}
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-pink-200 flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">AI 감지</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                          {message.event.type === "wedding" && "결혼"}
                          {message.event.type === "birthday" && "생일"}
                          {message.event.type === "funeral" && "부고"}
                          {message.event.type === "reunion" && "모임"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-medium">
                        이벤트가 감지되었습니다. 답장을 생성할까요?
                      </p>
                    </div>
                  </div>

                  {/* 축의금/조의금 가이드 */}
                  {(message.event.type === "wedding" || message.event.type === "funeral") && (
                    <div className="bg-white/80 rounded-xl px-3 py-2 mb-3 text-center">
                      <span className="text-sm text-muted-foreground">
                        💡 {message.event.type === "wedding" ? "축의금" : "조의금"} 가이드: 이 관계면{" "}
                        <span className="font-medium text-foreground">
                          {(chat.intimacyScore || 0) >= 70 ? "10만원" : (chat.intimacyScore || 0) >= 40 ? "5만원" : "3만원"}
                        </span>
                        이 적당해요
                      </span>
                    </div>
                  )}

                  {/* 답장 생성 버튼 */}
                  <Button
                    onClick={() => handleGenerateReply(message.event, message.id)}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-medium rounded-xl"
                    disabled={isLoadingSuggestions}
                  >
                    {isLoadingSuggestions ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        답장 생성하기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

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
      <div className="bg-card border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="채팅"
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
