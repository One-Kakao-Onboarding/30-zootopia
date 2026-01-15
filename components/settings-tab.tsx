"use client"

import { Bot, Zap, MessageSquare, Smile, Heart, Briefcase, ChevronRight, Sparkles, LogOut } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/app/page"

interface SettingsTabProps {
  onLogout?: () => void
}

export function SettingsTab({ onLogout }: SettingsTabProps) {
  const { settings, updateSettings, saveSettings } = useSettings()

  const handleUpdateSettings = async (newSettings: Parameters<typeof updateSettings>[0]) => {
    updateSettings(newSettings)
    // Auto-save after updating
    setTimeout(() => {
      saveSettings()
    }, 500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 카톡사이 AI 설정 섹션 */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">카톡사이 AI 설정</h2>
              <p className="text-xs text-muted-foreground">AI 답장 모드를 설정하세요</p>
            </div>
          </div>

          {/* 답장 모드 선택 */}
          <div className="space-y-3">
            {/* 자동 답장 모드 */}
            <button
              onClick={() => handleUpdateSettings({ replyMode: "auto" })}
              className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                settings.replyMode === "auto"
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary hover:bg-accent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    settings.replyMode === "auto" ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Zap
                    className={`w-5 h-5 ${settings.replyMode === "auto" ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">완전 자동 답장 모드</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.replyMode === "auto" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    >
                      {settings.replyMode === "auto" && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    설정한 친밀도 기준 이하의 연락에 AI가 자동으로 답장합니다. 바쁠 때 유용해요.
                  </p>
                </div>
              </div>
            </button>

            {/* AI 추천 후 선택 모드 */}
            <button
              onClick={() => handleUpdateSettings({ replyMode: "suggest" })}
              className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                settings.replyMode === "suggest"
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary hover:bg-accent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    settings.replyMode === "suggest" ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <MessageSquare
                    className={`w-5 h-5 ${settings.replyMode === "suggest" ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">AI 추천 후 선택 모드</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.replyMode === "suggest" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    >
                      {settings.replyMode === "suggest" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    AI가 여러 답장 옵션을 제안하면, 내가 직접 선택해서 보냅니다. 더 세심한 소통이 가능해요.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 자동 답장 세부 설정 - auto 모드일 때만 표시 */}
        {settings.replyMode === "auto" && (
          <div className="px-4 pb-5">
            <div className="bg-secondary rounded-2xl p-4 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm text-foreground">자동 답장 세부 설정</span>
              </div>

              {/* 친밀도 기준 슬라이더 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">자동 답장 친밀도 기준</span>
                  <span className="text-sm font-semibold text-primary">{settings.autoReplyThreshold}점 이하</span>
                </div>
                <Slider
                  value={[settings.autoReplyThreshold]}
                  onValueChange={([value]) => handleUpdateSettings({ autoReplyThreshold: value })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  친밀도 {settings.autoReplyThreshold}점 이하인 연락에만 자동 답장이 적용됩니다
                </p>
              </div>

              {/* 기본 어조 선택 */}
              <div className="space-y-3">
                <span className="text-sm text-muted-foreground">기본 답장 어조</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateSettings({ defaultTone: "polite" })}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      settings.defaultTone === "polite"
                        ? "bg-green-100 border-2 border-green-500"
                        : "bg-card border-2 border-transparent hover:bg-accent"
                    }`}
                  >
                    <Smile
                      className={`w-5 h-5 ${settings.defaultTone === "polite" ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        settings.defaultTone === "polite" ? "text-green-700" : "text-muted-foreground"
                      }`}
                    >
                      정중한
                    </span>
                  </button>
                  <button
                    onClick={() => handleUpdateSettings({ defaultTone: "friendly" })}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      settings.defaultTone === "friendly"
                        ? "bg-pink-100 border-2 border-pink-500"
                        : "bg-card border-2 border-transparent hover:bg-accent"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${settings.defaultTone === "friendly" ? "text-pink-600" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        settings.defaultTone === "friendly" ? "text-pink-700" : "text-muted-foreground"
                      }`}
                    >
                      친근한
                    </span>
                  </button>
                  <button
                    onClick={() => handleUpdateSettings({ defaultTone: "formal" })}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      settings.defaultTone === "formal"
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-card border-2 border-transparent hover:bg-accent"
                    }`}
                  >
                    <Briefcase
                      className={`w-5 h-5 ${settings.defaultTone === "formal" ? "text-blue-600" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        settings.defaultTone === "formal" ? "text-blue-700" : "text-muted-foreground"
                      }`}
                    >
                      공식적
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <p className="text-xs text-muted-foreground">카톡사이 v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
