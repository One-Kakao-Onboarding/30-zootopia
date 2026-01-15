"use client"

import { X, MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">카톡사이 설정</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* AI Mode Section */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI 답장 모드</h3>

            {/* Suggest Mode - Only mode available */}
            <div className="w-full p-4 rounded-2xl border-2 border-primary bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">AI 추천 모드</p>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">활성화</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    이벤트가 감지되면 AI가 해당 친구와의 대화 스타일을 분석하여 맞춤 답장을 추천합니다. 원하는 답장을 선택해서 보내세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">이렇게 동작해요</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  상대방의 메시지에서 결혼, 생일 등 이벤트가 감지됩니다
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI가 해당 친구와의 대화 기록을 분석하여 말투를 학습합니다
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  3가지 스타일의 답장을 추천하고, 마음에 드는 답장을 선택해 보냅니다
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4">
            <div className="bg-accent/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">카톡사이란?</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                카톡사이는 AI가 대화 맥락과 관계를 분석하여 최적의 답장을 추천해주는 서비스입니다. 오랜만에 연락온
                지인이나 어색한 상황에서 적절한 답변을 찾는 데 도움을 드립니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
