"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi, type LoginResponse } from "@/lib/api"

interface LoginScreenProps {
  onLogin: (userId: string, userData?: LoginResponse) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!userId.trim()) {
      setError("아이디를 입력해주세요")
      return
    }

    setIsLoading(true)

    try {
      const userData = await authApi.login(userId.trim())
      onLogin(userId.trim(), userData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FEE500] flex flex-col items-center justify-center px-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <img
          src="/logo-icon.png"
          alt="KaTalk S2"
          width={120}
          height={120}
          className="mb-4"
        />
        <img
          src="/logo-text.png"
          alt="KaTalk S2"
          width={200}
          height={50}
        />
        <p className="text-sm text-[#3C1E1E]/70 mt-3">AI가 관리하는 나의 인간관계</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value)
              setError("")
            }}
            className="h-12 bg-white border-none rounded-xl text-base placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#3C1E1E]/20"
          />
          {error && <p className="text-sm text-red-600 pl-1">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#3C1E1E] hover:bg-[#2A1515] text-[#FEE500] font-semibold rounded-xl text-base transition-colors"
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      {/* Footer */}
      <p className="absolute bottom-8 text-xs text-[#3C1E1E]/50">아이디만으로 간편하게 로그인하세요</p>
    </div>
  )
}
