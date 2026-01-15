"use client"

import { useState, useEffect } from "react"
import { Search, X, Users, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RelationshipModal } from "@/components/relationship-modal"
import type { ChatPreview, Friend } from "@/app/page"
import { friendsApi, userApi, chatRoomApi, type FriendResponse, type UserResponse } from "@/lib/api"

interface FriendsListProps {
  onSelectChat: (chat: ChatPreview) => void
}

function convertToFriend(friendResponse: FriendResponse): Friend {
  return {
    id: friendResponse.id.toString(),
    name: friendResponse.name,
    avatar: friendResponse.avatar || '/default-avatar.png',
    statusMessage: friendResponse.statusMessage,
    intimacyScore: friendResponse.intimacyScore,
  }
}

export function FriendsList({ onSelectChat }: FriendsListProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [myProfile, setMyProfile] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [friendsData, userData] = await Promise.all([
          friendsApi.getAll(),
          userApi.getMe()
        ])
        setFriends(friendsData.map(convertToFriend))
        setMyProfile(userData)
      } catch (error) {
        console.error('Failed to load friends:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.statusMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleFriendClick = async (friend: Friend) => {
    // Find or create chat room with this friend
    try {
      const chatRooms = await chatRoomApi.getAll()
      let existingRoom = chatRooms.find(room =>
        room.type === 'direct' &&
        room.members?.some(m => m.id.toString() === friend.id)
      )

      if (existingRoom) {
        onSelectChat({
          id: existingRoom.id.toString(),
          name: existingRoom.name,
          avatar: existingRoom.avatar || friend.avatar,
          lastMessage: existingRoom.lastMessage || "",
          timestamp: existingRoom.lastMessageAt || "",
          unread: existingRoom.unreadCount,
          intimacyScore: existingRoom.intimacyScore,
        })
      } else {
        // Create new chat room
        const newRoom = await chatRoomApi.create({
          type: 'DIRECT',
          memberIds: [parseInt(friend.id)]
        })
        onSelectChat({
          id: newRoom.id.toString(),
          name: newRoom.name,
          avatar: newRoom.avatar || friend.avatar,
          lastMessage: "",
          timestamp: "",
          intimacyScore: friend.intimacyScore,
        })
      }
    } catch (error) {
      console.error('Failed to open chat:', error)
      // Try to create a new chat room as fallback
      try {
        const newRoom = await chatRoomApi.create({
          type: 'DIRECT',
          memberIds: [parseInt(friend.id)]
        })
        onSelectChat({
          id: newRoom.id.toString(),
          name: newRoom.name || friend.name,
          avatar: newRoom.avatar || friend.avatar,
          lastMessage: "",
          timestamp: "",
          intimacyScore: friend.intimacyScore,
        })
      } catch (createError) {
        console.error('Failed to create chat room:', createError)
        alert('채팅방을 열 수 없습니다.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <header className="bg-card px-4 py-3 flex items-center justify-between">
        {isSearchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="이름 또는 상태메시지 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-0 rounded-lg flex-1"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery("")
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">친구</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowRelationshipModal(true)}>
                <Users className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </header>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {/* My Profile - hidden during search */}
        {!isSearchOpen && myProfile && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14">
                <AvatarImage src={myProfile.avatar || "/placeholder.svg"} />
                <AvatarFallback>나</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{myProfile.name || myProfile.userId}</p>
                <p className="text-sm text-muted-foreground truncate">{myProfile.statusMessage || '카톡사이와 함께하는 스마트한 대화'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Friends Count */}
        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {isSearchOpen && searchQuery ? `검색 결과 ${filteredFriends.length}명` : `친구 ${friends.length}`}
          </p>
        </div>

        {/* Friend Items - Now uses filteredFriends */}
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => handleFriendClick(friend)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                <AvatarFallback>{friend.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{friend.name}</p>
                {friend.statusMessage && (
                  <p className="text-sm text-muted-foreground truncate">{friend.statusMessage}</p>
                )}
              </div>
              {friend.intimacyScore !== undefined && (
                <span className="text-xs text-muted-foreground">{friend.intimacyScore}점</span>
              )}
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{isSearchOpen ? '검색 결과가 없습니다' : '친구가 없습니다'}</p>
          </div>
        )}
      </div>

      <RelationshipModal isOpen={showRelationshipModal} onClose={() => setShowRelationshipModal(false)} />
    </div>
  )
}
