"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, X, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { ChatPreview } from "@/app/page"

interface ChatListProps {
  chats: ChatPreview[]
  onSelectChat: (chat: ChatPreview) => void
  onLeaveChat: (chatId: string) => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  chatId: string | null
}

export function ChatList({ chats, onSelectChat, onLeaveChat }: ChatListProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({})
  const [lockedChatId, setLockedChatId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    chatId: null,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const startXRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)
  const dragChatIdRef = useRef<string | null>(null)
  const swipeOffsetsRef = useRef<Record<string, number>>({})

  const LEAVE_BUTTON_WIDTH = 80
  const LOCK_THRESHOLD = 0.4

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return chat.name.toLowerCase().includes(query) || chat.lastMessage.toLowerCase().includes(query)
  })

  const handleSearchClose = () => {
    setIsSearching(false)
    setSearchQuery("")
  }

  const handleSwipeStart = (clientX: number, chatId: string) => {
    if (lockedChatId && lockedChatId !== chatId) {
      setSwipeOffsets((prev) => {
        const next = { ...prev }
        next[lockedChatId] = 0
        return next
      })
      swipeOffsetsRef.current[lockedChatId] = 0
      setLockedChatId(null)
    }
    startXRef.current = clientX
    isDraggingRef.current = true
    dragChatIdRef.current = chatId

    if (lockedChatId === chatId) {
      startXRef.current = clientX + LEAVE_BUTTON_WIDTH
    }
  }

  const handleSwipeMove = (clientX: number) => {
    if (!isDraggingRef.current || !dragChatIdRef.current) return
    const diff = startXRef.current - clientX
    const offset = Math.max(0, Math.min(LEAVE_BUTTON_WIDTH, diff))
    const chatId = dragChatIdRef.current
    setSwipeOffsets((prev) => {
      const next = { ...prev }
      next[chatId] = offset
      return next
    })
    swipeOffsetsRef.current[chatId] = offset
  }

  const handleSwipeEnd = useCallback(() => {
    if (!isDraggingRef.current || !dragChatIdRef.current) return
    const chatId = dragChatIdRef.current
    const currentOffset = swipeOffsetsRef.current[chatId] || 0

    if (currentOffset >= LEAVE_BUTTON_WIDTH * LOCK_THRESHOLD) {
      setLockedChatId(chatId)
      setSwipeOffsets((prev) => {
        const next = { ...prev }
        next[chatId] = LEAVE_BUTTON_WIDTH
        return next
      })
      swipeOffsetsRef.current[chatId] = LEAVE_BUTTON_WIDTH
    } else {
      setLockedChatId(null)
      setSwipeOffsets((prev) => {
        const next = { ...prev }
        next[chatId] = 0
        return next
      })
      swipeOffsetsRef.current[chatId] = 0
    }

    isDraggingRef.current = false
    dragChatIdRef.current = null
  }, [])

  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    handleSwipeStart(e.touches[0].clientX, chatId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleSwipeMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleSwipeEnd()
  }

  const handleMouseDown = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    handleSwipeStart(e.clientX, chatId)
  }

  const handleMouseUp = () => {
    handleSwipeEnd()
  }

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const containerRect = containerRef.current?.getBoundingClientRect()
    const x = e.clientX - (containerRect?.left || 0)
    const y = e.clientY - (containerRect?.top || 0)

    setContextMenu({
      visible: true,
      x,
      y,
      chatId,
    })
  }

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      chatId: null,
    })
  }

  const handleContextMenuLeave = () => {
    if (contextMenu.chatId) {
      onLeaveChat(contextMenu.chatId)
      setLockedChatId(null)
      setSwipeOffsets((prev) => {
        const next = { ...prev }
        delete next[contextMenu.chatId!]
        return next
      })
    }
    closeContextMenu()
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu()
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu.visible])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleSwipeMove(e.clientX)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        handleSwipeEnd()
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleGlobalMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [handleSwipeEnd])

  const handleLeaveChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    onLeaveChat(chatId)
    setLockedChatId(null)
    setSwipeOffsets((prev) => {
      const next = { ...prev }
      delete next[chatId]
      return next
    })
  }

  const handleChatClick = (chat: ChatPreview) => {
    const offset = swipeOffsets[chat.id] || 0
    if (offset > 0 || lockedChatId === chat.id) {
      setLockedChatId(null)
      setSwipeOffsets((prev) => {
        const next = { ...prev }
        next[chat.id] = 0
        return next
      })
      return
    }
    onSelectChat(chat)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative" ref={containerRef}>
      <header className="bg-card px-4 py-3 flex items-center justify-between">
        {isSearching ? (
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="채팅방 이름, 메시지 검색"
              className="flex-1 bg-transparent border-0 p-0 h-auto focus-visible:ring-0 text-foreground"
            />
            <Button variant="ghost" size="icon" onClick={handleSearchClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">채팅</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)}>
              <Search className="w-5 h-5" />
            </Button>
          </>
        )}
      </header>

      {isSearching && searchQuery && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
          검색 결과: {filteredChats.length}개의 채팅방
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p>검색 결과가 없습니다</p>
            <p className="text-sm mt-1">다른 검색어로 시도해보세요</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const offset = swipeOffsets[chat.id] || 0
            return (
              <div
                key={chat.id}
                className="relative overflow-hidden select-none"
                onTouchStart={(e) => handleTouchStart(e, chat.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleMouseDown(e, chat.id)}
                onMouseUp={handleMouseUp}
                onContextMenu={(e) => handleContextMenu(e, chat.id)}
              >
                <div
                  className="absolute top-0 bottom-0 flex items-center justify-center bg-destructive"
                  style={{
                    width: LEAVE_BUTTON_WIDTH,
                    right: 0,
                    transform: `translateX(${LEAVE_BUTTON_WIDTH - offset}px)`,
                    transition: isDraggingRef.current ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <button
                    onClick={(e) => handleLeaveChat(e, chat.id)}
                    className="h-full w-full flex flex-col items-center justify-center gap-1 text-destructive-foreground font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-xs">나가기</span>
                  </button>
                </div>

                <div
                  onClick={() => handleChatClick(chat)}
                  className="relative px-4 py-3 flex items-center gap-3 bg-card cursor-pointer active:bg-muted/50"
                  style={{
                    transform: `translateX(-${offset}px)`,
                    transition: isDraggingRef.current ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{chat.name}</p>
                      <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-muted-foreground truncate pr-2">{chat.lastMessage}</p>
                      {typeof chat.unread === "number" && chat.unread > 0 && (
                        <span className="shrink-0 bg-destructive text-destructive-foreground text-xs font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full">
                          {chat.unread > 99 ? "99+" : chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {contextMenu.visible && (
        <div
          className="absolute z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleContextMenuLeave}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 text-destructive"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">나가기</span>
          </button>
        </div>
      )}
    </div>
  )
}
