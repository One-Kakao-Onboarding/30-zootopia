"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, MoreVertical, Sparkles, LogOut, Zap, Smile, Heart, Briefcase, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
}

const eventKeywords = {
  wedding: ["결혼", "결혼해", "청첩장", "식 올려", "웨딩"],
  birthday: ["생일", "생파", "생일 축하"],
  funeral: ["부고", "돌아가", "장례"],
  reunion: ["오랜만", "연락 안 했", "잘 지냈"],
}

const replyOptions = {
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
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "야 나 결혼해! 💍",
    sender: "other",
    timestamp: "14:32",
  },
  {
    id: "2",
    content: "다음 달 15일에 식 올리는데 와줄 수 있어?",
    sender: "other",
    timestamp: "14:33",
  },
]

export function ChatRoom({ chat, onBack, onLeaveChat }: ChatRoomProps) {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [detectedEvent, setDetectedEvent] = useState<keyof typeof replyOptions | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [autoReplySent, setAutoReplySent] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const lastOtherMessage = [...messages].reverse().find((m) => m.sender === "other")
    if (!lastOtherMessage) return

    for (const [event, keywords] of Object.entries(eventKeywords)) {
      if (keywords.some((keyword) => lastOtherMessage.content.includes(keyword))) {
        setDetectedEvent(event as keyof typeof replyOptions)
        setShowAIPanel(true)
        setAutoReplySent(false)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handleSendMessage = (content?: string) => {
    const messageContent = content || inputValue
    if (!messageContent.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "me",
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setInputValue("")
    setShowAIPanel(false)
    setAutoReplySent(true)
  }

  const handleLeaveChat = () => {
    if (onLeaveChat) {
      onLeaveChat(chat.id)
      onBack()
    }
    setShowOptionsMenu(false)
  }

  const getAutoReply = () => {
    if (!detectedEvent) return ""
    const toneMap = {
      polite: "polite",
      friendly: "friendly",
      formal: "formal",
    } as const
    return replyOptions[detectedEvent][toneMap[settings.defaultTone]]
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
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {showAIPanel && detectedEvent && !autoReplySent && (
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

          {/* Auto Mode: Show prepared reply */}
          {settings.replyMode === "auto" ? (
            <div className="p-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">자동 준비된 답장</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{getAutoReply()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSendMessage(getAutoReply())}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  바로 보내기
                </Button>
                <Button variant="outline" onClick={() => setShowAIPanel(false)} className="px-4">
                  취소
                </Button>
              </div>
            </div>
          ) : (
            /* Suggest Mode: Show multiple options */
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleSendMessage(replyOptions[detectedEvent].polite)}
                className="w-full p-3 bg-secondary hover:bg-accent rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Smile className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="font-medium text-xs text-foreground">정중한 타입</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{replyOptions[detectedEvent].polite}</p>
              </button>

              <button
                onClick={() => handleSendMessage(replyOptions[detectedEvent].friendly)}
                className="w-full p-3 bg-secondary hover:bg-accent rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                    <Heart className="w-3 h-3 text-pink-600" />
                  </div>
                  <span className="font-medium text-xs text-foreground">친근한 타입</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{replyOptions[detectedEvent].friendly}</p>
              </button>

              <button
                onClick={() => handleSendMessage(replyOptions[detectedEvent].formal)}
                className="w-full p-3 bg-secondary hover:bg-accent rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="font-medium text-xs text-foreground">공식적 타입</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{replyOptions[detectedEvent].formal}</p>
              </button>
            </div>
          )}

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

      {/* Input - Hide when AI panel is shown */}
      {(!showAIPanel || autoReplySent) && (
        <div className="bg-card border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="메시지 입력"
              className="flex-1 bg-secondary border-0 rounded-full px-4"
            />
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
