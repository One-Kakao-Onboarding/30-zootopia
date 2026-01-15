"use client"

import { X, Zap, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useSettings } from "@/app/page"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings()

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
          {/* Reply Mode Section */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">답장 모드 선택</h3>

            {/* Auto Reply Mode */}
            <button
              onClick={() => updateSettings({ replyMode: "auto" })}
              className={`w-full p-4 rounded-2xl border-2 mb-3 text-left transition-all ${
                settings.replyMode === "auto"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    settings.replyMode === "auto" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">완전 자동 답장</p>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.replyMode === "auto" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    >
                      {settings.replyMode === "auto" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    설정한 친밀도 이하의 연락에 AI가 자동으로 답장을 준비합니다. 확인 후 바로 전송할 수 있어요.
                  </p>
                </div>
              </div>
            </button>

            {/* Suggest Mode */}
            <button
              onClick={() => updateSettings({ replyMode: "suggest" })}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                settings.replyMode === "suggest"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    settings.replyMode === "suggest" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">AI 추천 후 선택</p>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.replyMode === "suggest" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    >
                      {settings.replyMode === "suggest" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI가 여러 답장 옵션을 제안하고, 원하는 답장을 직접 선택해서 보냅니다.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Auto Settings - Only show when auto mode */}
          {settings.replyMode === "auto" && (
            <div className="p-4 border-b border-border animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">자동 답장 설정</h3>

              {/* Threshold */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-foreground">자동 답장 친밀도 기준</span>
                  <span className="text-sm font-semibold text-primary">{settings.autoReplyThreshold}점 이하</span>
                </div>
                <Slider
                  value={[settings.autoReplyThreshold]}
                  onValueChange={(value) => updateSettings({ autoReplyThreshold: value[0] })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  친밀도가 {settings.autoReplyThreshold}점 이하인 연락에만 자동 답장이 적용됩니다.
                </p>
              </div>

              {/* Default Tone */}
              <div>
                <p className="text-sm text-foreground mb-3">기본 어조</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "polite", label: "정중한" },
                    { value: "friendly", label: "친근한" },
                    { value: "formal", label: "공식적" },
                  ].map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => updateSettings({ defaultTone: tone.value as "polite" | "friendly" | "formal" })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                        settings.defaultTone === tone.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="p-4">
            <div className="bg-accent/50 rounded-2xl p-4">
              <p className="text-sm font-medium text-foreground mb-2">카톡사이란?</p>
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
