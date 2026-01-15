"use client"

import { useState } from "react"
import { Search, X, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RelationshipModal } from "@/components/relationship-modal"
import type { ChatPreview, Friend } from "@/app/page"

interface FriendsListProps {
  onSelectChat: (chat: ChatPreview) => void
}

const myProfile = {
  id: "me",
  name: "나",
  avatar: "/korean-man-profile.png",
  statusMessage: "카톡사이와 함께하는 스마트한 대화",
}

const friends: Friend[] = [
  {
    id: "1",
    name: "김민지",
    avatar: "/korean-woman-profile.png",
    statusMessage: "곧 결혼해요 💍",
    intimacyScore: 23,
  },
  {
    id: "2",
    name: "이준호",
    avatar: "/korean-man-casual.png",
    statusMessage: "열심히 살자",
    intimacyScore: 87,
  },
  {
    id: "3",
    name: "박서연",
    avatar: "/korean-woman-glasses.jpg",
    statusMessage: "커피가 필요해 ☕",
    intimacyScore: 65,
  },
  {
    id: "4",
    name: "최현우",
    avatar: "/korean-man-suit.jpg",
    statusMessage: "",
    intimacyScore: 42,
  },
  {
    id: "5",
    name: "정유나",
    avatar: "/korean-woman-smile.jpg",
    statusMessage: "여행 중 🌴",
    intimacyScore: 91,
  },
]

export function FriendsList({ onSelectChat }: FriendsListProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.statusMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleFriendClick = (friend: Friend) => {
    onSelectChat({
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      lastMessage: "",
      timestamp: "",
      intimacyScore: friend.intimacyScore,
    })
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
        {!isSearchOpen && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14">
                <AvatarImage src={myProfile.avatar || "/placeholder.svg"} />
                <AvatarFallback>나</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{myProfile.name}</p>
                <p className="text-sm text-muted-foreground truncate">{myProfile.statusMessage}</p>
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
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      <RelationshipModal isOpen={showRelationshipModal} onClose={() => setShowRelationshipModal(false)} />
    </div>
  )
}
