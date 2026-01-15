"use client"

import { AlertTriangle } from "lucide-react"

interface AIInsightChipProps {
  message: string
}

export function AIInsightChip({ message }: AIInsightChipProps) {
  return (
    <div className="flex justify-center my-2 animate-in fade-in duration-300">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-warning/20 text-warning rounded-full text-xs font-medium">
        <AlertTriangle className="w-3 h-3" />
        <span>{message}</span>
      </div>
    </div>
  )
}
