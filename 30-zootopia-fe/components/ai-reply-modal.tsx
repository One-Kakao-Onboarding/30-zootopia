"use client"

import { useState } from "react"
import { X, Smile, Heart, Briefcase, Zap, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { AIReplyResponse } from "@/lib/api"

interface AIReplyModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectReply: (reply: string) => void
  eventType?: "wedding" | "birthday" | "funeral" | "reunion" | "general"
  aiReplies?: AIReplyResponse | null
}

const replyOptions = {
  wedding: {
    polite: "와 정말 축하해! 너무 기쁜 소식이다 당연히 갈게! 청첩장 보내줘~",
    friendly: "헐 대박!! 축하해 친구야!! 꼭 갈게 진짜!! 신랑/신부 누구야?!",
    formal: "결혼 축하해. 그날 일정 확인해보고 연락할게.",
  },
  birthday: {
    polite: "생일 축하해! 좋은 하루 보내",
    friendly: "생일 축하해!! 올해도 건강하고 행복하자!",
    formal: "생일 축하드립니다. 좋은 한 해 되세요.",
  },
  funeral: {
    polite: "정말 안타깝네. 삼가 고인의 명복을 빕니다.",
    friendly: "많이 힘들겠다... 옆에 있어줄게. 필요한 거 있으면 말해.",
    formal: "깊은 위로의 말씀을 전합니다. 삼가 고인의 명복을 빕니다.",
  },
  reunion: {
    polite: "오랜만이야! 잘 지냈어? 반가워",
    friendly: "헐 진짜 오랜만!! 어떻게 지냈어?!",
    formal: "오랜만이네요. 잘 지내셨나요?",
  },
  general: {
    polite: "응 알겠어! 확인했어",
    friendly: "오키오키!!",
    formal: "네, 확인했습니다.",
  },
}

const toneIcons = {
  polite: { icon: Smile, color: "green", label: "정중한 타입" },
  friendly: { icon: Heart, color: "pink", label: "친근한 타입" },
  formal: { icon: Briefcase, color: "blue", label: "공식적 타입" },
}

// 한국어 tone을 영어 키로 매핑
const koreanToneMap: Record<string, keyof typeof toneIcons> = {
  "정중한": "polite",
  "친근한": "friendly",
  "공식적": "formal",
}

export function AIReplyModal({ isOpen, onClose, onSelectReply, eventType = "general", aiReplies }: AIReplyModalProps) {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const fallbackReplies = replyOptions[eventType]

  if (!isOpen) return null

  // Use AI-generated replies if available, otherwise use fallback
  const hasAiReplies = aiReplies && aiReplies.replies && aiReplies.replies.length > 0

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end justify-center">
      <div className="bg-card w-full max-w-md rounded-t-3xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI 답장 선택</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* AI Insight */}
        {hasAiReplies && aiReplies.aiInsight && (
          <div className="px-4 pt-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-sm text-foreground">{aiReplies.aiInsight}</p>
            </div>
          </div>
        )}

        {/* Reply Options */}
        <div className="p-4 space-y-3">
          {hasAiReplies ? (
            // AI-generated replies from backend
            aiReplies.replies.map((reply, index) => {
              // 한국어 또는 영어 tone 모두 지원
              const toneKey = koreanToneMap[reply.tone] || (reply.tone.toLowerCase() as keyof typeof toneIcons)
              const toneConfig = toneIcons[toneKey] || toneIcons.polite
              const Icon = toneConfig.icon
              const isRecommended = index === aiReplies.recommendedIndex

              return (
                <button
                  key={index}
                  onClick={() => onSelectReply(reply.message)}
                  className={`w-full p-4 rounded-2xl text-left transition-colors group ${
                    isRecommended
                      ? 'bg-primary/10 hover:bg-primary/15 border-2 border-primary/30'
                      : 'bg-secondary hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full bg-${toneConfig.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 text-${toneConfig.color}-600`} />
                    </div>
                    <span className="font-medium text-sm text-foreground">{toneConfig.label}</span>
                    {isRecommended && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">추천</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{reply.message}</p>
                  {reply.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 opacity-70">{reply.explanation}</p>
                  )}
                </button>
              )
            })
          ) : (
            // Fallback to static replies
            <>
              <button
                onClick={() => onSelectReply(fallbackReplies.polite)}
                className="w-full p-4 bg-secondary hover:bg-accent rounded-2xl text-left transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Smile className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-sm text-foreground">정중한 타입</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{fallbackReplies.polite}</p>
              </button>

              <button
                onClick={() => onSelectReply(fallbackReplies.friendly)}
                className="w-full p-4 bg-secondary hover:bg-accent rounded-2xl text-left transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="font-medium text-sm text-foreground">친근한 타입</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{fallbackReplies.friendly}</p>
              </button>

              <button
                onClick={() => onSelectReply(fallbackReplies.formal)}
                className="w-full p-4 bg-secondary hover:bg-accent rounded-2xl text-left transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm text-foreground">공식적 타입</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{fallbackReplies.formal}</p>
              </button>
            </>
          )}
        </div>

        {/* Auto Reply Toggle */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">완전 자동 답장 모드</p>
                <p className="text-xs text-muted-foreground">친밀도 20점 미만에게 자동 응답</p>
              </div>
            </div>
            <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
          </div>
        </div>
      </div>
    </div>
  )
}
