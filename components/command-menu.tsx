"use client"

import { Trophy, Settings, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommandMenuProps {
  onSelect: (command: string) => void
  onClose: () => void
}

export function CommandMenu({ onSelect, onClose }: CommandMenuProps) {
  const commands = [
    {
      id: "rank",
      icon: Trophy,
      label: "관계 랭킹 확인",
      description: "친밀도 순위 보기",
    },
    {
      id: "settings",
      icon: Settings,
      label: "자동 답장 설정",
      description: "AI 자동 응답 관리",
    },
    {
      id: "generate",
      icon: Sparkles,
      label: "AI 답장 생성",
      description: "맞춤 답변 추천받기",
    },
  ]

  return (
    <div className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-200 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">@카톡사이 명령어</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2">
        {commands.map((command) => (
          <button
            key={command.id}
            onClick={() => onSelect(command.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <command.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{command.label}</p>
              <p className="text-xs text-muted-foreground">{command.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
