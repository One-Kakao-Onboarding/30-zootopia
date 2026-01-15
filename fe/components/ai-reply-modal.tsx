"use client"

import { X, Smile, Heart, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
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

// 타입별 스타일 설정
const toneStyles = {
  polite: {
    icon: Smile,
    label: "정중한 타입",
    bgColor: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
  },
  friendly: {
    icon: Heart,
    label: "친근한 타입",
    bgColor: "bg-pink-50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-500",
  },
  formal: {
    icon: Briefcase,
    label: "공식적 타입",
    bgColor: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
}

// 한국어 tone을 영어 키로 매핑
const koreanToneMap: Record<string, keyof typeof toneStyles> = {
  "정중한": "polite",
  "친근한": "friendly",
  "공식적": "formal",
}

export function AIReplyModal({ isOpen, onClose, onSelectReply, eventType = "general", aiReplies }: AIReplyModalProps) {
  const fallbackReplies = replyOptions[eventType]

  if (!isOpen) return null

  const hasAiReplies = aiReplies && aiReplies.replies && aiReplies.replies.length > 0

  // AI 응답을 정렬해서 정중한, 친근한, 공식적 순서로 표시
  const sortedReplies = hasAiReplies
    ? [...aiReplies.replies].sort((a, b) => {
        const order = ["정중한", "친근한", "공식적"]
        return order.indexOf(a.tone) - order.indexOf(b.tone)
      })
    : null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">AI 답장 선택</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Reply Options */}
        <div className="p-4 space-y-3">
          {sortedReplies ? (
            // AI-generated replies from backend
            sortedReplies.map((reply, index) => {
              const toneKey = koreanToneMap[reply.tone] || "polite"
              const style = toneStyles[toneKey]
              const Icon = style.icon

              return (
                <button
                  key={index}
                  onClick={() => onSelectReply(reply.message)}
                  className={`w-full p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${style.bgColor}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${style.iconColor}`} />
                    </div>
                    <span className="font-semibold text-foreground">{style.label}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed pl-1">{reply.message}</p>
                </button>
              )
            })
          ) : (
            // Fallback to static replies
            <>
              <button
                onClick={() => onSelectReply(fallbackReplies.polite)}
                className="w-full p-4 bg-green-50 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Smile className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="font-semibold text-foreground">정중한 타입</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed pl-1">{fallbackReplies.polite}</p>
              </button>

              <button
                onClick={() => onSelectReply(fallbackReplies.friendly)}
                className="w-full p-4 bg-pink-50 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <span className="font-semibold text-foreground">친근한 타입</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed pl-1">{fallbackReplies.friendly}</p>
              </button>

              <button
                onClick={() => onSelectReply(fallbackReplies.formal)}
                className="w-full p-4 bg-blue-50 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-semibold text-foreground">공식적 타입</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed pl-1">{fallbackReplies.formal}</p>
              </button>
            </>
          )}
        </div>

        {/* Bottom padding */}
        <div className="pb-6" />
      </div>
    </div>
  )
}
