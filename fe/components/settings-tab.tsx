"use client"

import { Bot, MessageSquare, ChevronRight, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/app/page"

interface SettingsTabProps {
  onLogout?: () => void
}

export function SettingsTab({ onLogout }: SettingsTabProps) {
  const { settings } = useSettings()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="KaTalk S2" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-foreground">설정</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 카톡사이 AI 설정 섹션 */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">KaTalk S2 AI 설정</h2>
              <p className="text-xs text-muted-foreground">AI 답장 추천 모드</p>
            </div>
          </div>

          {/* AI 추천 모드 설명 */}
          <div className="bg-secondary rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">AI 추천 모드</span>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  이벤트가 감지되면 AI가 해당 친구와의 대화 스타일을 분석하여 맞춤 답장을 추천합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 기타 설정 */}
        <div className="px-4 pb-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">기타 설정</h3>
          <div className="bg-secondary rounded-2xl divide-y divide-border">
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors rounded-t-2xl">
              <span className="text-sm text-foreground">알림 설정</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
              <span className="text-sm text-foreground">개인정보 처리방침</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors rounded-b-2xl">
              <span className="text-sm text-foreground">앱 정보</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        {onLogout && (
          <div className="px-4 pb-5">
            <Button
              variant="outline"
              className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        )}

        {/* 버전 정보 */}
        <div className="px-4 pb-8 text-center">
          <p className="text-xs text-muted-foreground">KaTalk S2 v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

// Modal version of settings for use in chat room
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
          <h2 className="text-lg font-bold text-foreground">AI 설정</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* AI 추천 모드 설명 */}
          <div className="bg-secondary rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <span className="font-medium text-foreground">AI 추천 모드</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  해당 친구와의 대화 스타일을 분석하여 맞춤 답장을 추천합니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
