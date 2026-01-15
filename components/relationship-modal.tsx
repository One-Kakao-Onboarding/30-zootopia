"use client"

import { useState, useEffect } from "react"
import { X, Search, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { friendsApi, type FriendResponse, type RelationshipStatsResponse } from "@/lib/api"

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Friend {
  id: string
  name: string
  avatar: string
  score: number
  trend: "up" | "down" | "stable"
  lastContact: string
  replySpeed: "fast" | "normal" | "slow"
  initiator: "me" | "them" | "equal"
  badge: "bestie" | "close" | "acquaintance" | "distant"
}

function formatLastContact(dateString: string | null): string {
  if (!dateString) return '기록 없음'

  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`
  return `${Math.floor(diffDays / 365)}년 전`
}

function convertToFriend(friendResponse: FriendResponse): Friend {
  return {
    id: friendResponse.id.toString(),
    name: friendResponse.name,
    avatar: friendResponse.avatar || '/default-avatar.png',
    score: friendResponse.intimacyScore,
    trend: friendResponse.intimacyTrend,
    lastContact: formatLastContact(friendResponse.lastContactAt),
    replySpeed: friendResponse.replySpeed,
    initiator: friendResponse.initiator,
    badge: friendResponse.badge,
  }
}

const badgeConfig = {
  bestie: { label: "베스트", color: "bg-pink-500 text-white", icon: Crown },
  close: { label: "친한 친구", color: "bg-blue-500 text-white", icon: Medal },
  acquaintance: { label: "지인", color: "bg-gray-400 text-white", icon: Award },
  distant: { label: "먼 사이", color: "bg-gray-300 text-gray-600", icon: null },
}

export function RelationshipModal({ isOpen, onClose }: RelationshipModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState<Friend[]>([])
  const [stats, setStats] = useState<RelationshipStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [rankingData, statsData] = await Promise.all([
          friendsApi.getRanking(),
          friendsApi.getStats()
        ])
        setFriends(rankingData.map(convertToFriend))
        setStats(statsData)
      } catch (error) {
        console.error('Failed to load relationship data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isOpen])

  if (!isOpen) return null

  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">관계 랭킹</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="친구 검색..."
                  className="pl-10 bg-secondary border-0 rounded-full"
                />
              </div>
            </div>

            {/* Stats Summary */}
            <div className="px-4 py-3 bg-accent/30">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-primary">{stats?.bestieCount || 0}</p>
                  <p className="text-xs text-muted-foreground">베스트</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-foreground">{stats?.closeCount || 0}</p>
                  <p className="text-xs text-muted-foreground">친한 친구</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-muted-foreground">{stats?.distantCount || 0}</p>
                  <p className="text-xs text-muted-foreground">먼 사이</p>
                </div>
              </div>
            </div>

            {/* Friend List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-3">총 {filteredFriends.length}명의 친구</p>
              {filteredFriends.length > 0 ? (
                <div className="space-y-3">
                  {filteredFriends.map((friend, index) => (
                    <FriendCard key={friend.id} friend={friend} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">친구가 없습니다</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FriendCard({ friend, rank }: { friend: Friend; rank: number }) {
  const badge = badgeConfig[friend.badge]

  const TrendIcon = friend.trend === "up" ? TrendingUp : friend.trend === "down" ? TrendingDown : Minus
  const trendColor =
    friend.trend === "up" ? "text-green-500" : friend.trend === "down" ? "text-red-500" : "text-gray-400"

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="w-6 text-center">
          {rank <= 3 ? (
            <span
              className={`text-lg font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : "text-amber-600"}`}
            >
              {rank}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">{rank}</span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar || "/placeholder.svg"} />
          <AvatarFallback>{friend.name[0]}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground">{friend.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={friend.score} className="flex-1 h-2" />
            <span className="text-sm font-semibold text-foreground w-10 text-right">{friend.score}pt</span>
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">마지막 연락</p>
          <p className="text-xs font-medium text-foreground">{friend.lastContact}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">답장 속도</p>
          <p className="text-xs font-medium text-foreground">
            {friend.replySpeed === "fast" ? "빠름" : friend.replySpeed === "normal" ? "보통" : "느림"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">선톡</p>
          <p className="text-xs font-medium text-foreground">
            {friend.initiator === "me" ? "내가 많이" : friend.initiator === "them" ? "상대가 많이" : "비슷함"}
          </p>
        </div>
      </div>
    </div>
  )
}
