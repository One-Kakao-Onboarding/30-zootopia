"use client"

import { Heart, Cake, Flower2, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventDetectionCardProps {
  eventType: "wedding" | "birthday" | "funeral" | "reunion" | "general"
  onGenerateReply: () => void
}

const eventConfig = {
  wedding: {
    icon: Heart,
    label: "결혼",
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    suggestion: "축의금 가이드: 이 관계면 5만원이 적당해요",
  },
  birthday: {
    icon: Cake,
    label: "생일",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    suggestion: null,
  },
  funeral: {
    icon: Flower2,
    label: "부고",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    suggestion: "조의금 가이드: 이 관계면 3만원이 적당해요",
  },
  reunion: {
    icon: Users,
    label: "오랜만",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    suggestion: null,
  },
  general: {
    icon: Sparkles,
    label: "이벤트",
    color: "text-primary",
    bgColor: "bg-primary/10",
    suggestion: null,
  },
}

export function EventDetectionCard({ eventType, onGenerateReply }: EventDetectionCardProps) {
  const config = eventConfig[eventType]
  const Icon = config.icon

  return (
    <div className="mx-10 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={`${config.bgColor} rounded-xl p-4 border border-border/50`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">AI 감지</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground mb-2">
              이벤트가 감지되었습니다. 답장을 생성할까요?
            </p>
            {config.suggestion && (
              <p className="text-xs text-muted-foreground mb-3 bg-card/50 rounded-lg px-2 py-1.5">
                {config.suggestion}
              </p>
            )}
            <Button
              onClick={onGenerateReply}
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              답장 생성하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
