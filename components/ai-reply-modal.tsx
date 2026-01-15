"use client"

import { useState } from "react"
import { X, Smile, Heart, Briefcase, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface AIReplyModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectReply: (reply: string) => void
  eventType?: "wedding" | "birthday" | "funeral" | "reunion" | "general"
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
  general: {
    polite: "응 알겠어! 확인했어 😊",
    friendly: "오키오키!! 👍",
    formal: "네, 확인했습니다.",
  },
}

export function AIReplyModal({ isOpen, onClose, onSelectReply, eventType = "general" }: AIReplyModalProps) {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const replies = replyOptions[eventType]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end justify-center">
      <div className="bg-card w-full max-w-md rounded-t-3xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">AI 답장 선택</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Reply Options */}
        <div className="p-4 space-y-3">
          <button
            onClick={() => onSelectReply(replies.polite)}
            className="w-full p-4 bg-secondary hover:bg-accent rounded-2xl text-left transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Smile className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium text-sm text-foreground">정중한 타입</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{replies.polite}</p>
          </button>

          <button
            onClick={() => onSelectReply(replies.friendly)}
            className="w-full p-4 bg-secondary hover:bg-accent rounded-2xl text-left transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-600" />
              </div>
              <span className="font-medium text-sm text-foreground">친근한 타입</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{replies.friendly}</p>
          </button>

          <button
            onClick={() => onSelectReply(replies.formal)}
            className="w-full p-4 bg-secondary hover:bg-accent rounded-2xl text-left transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-sm text-foreground">공식적 타입</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{replies.formal}</p>
          </button>
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
