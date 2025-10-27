"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface MoodScaleProps {
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  showLabels?: boolean
}

const MOOD_LEVELS = [
  { value: 1, emoji: "😢", label: "Very Low", color: "text-red-500" },
  { value: 2, emoji: "😞", label: "Low", color: "text-orange-500" },
  { value: 3, emoji: "😐", label: "Neutral", color: "text-yellow-500" },
  { value: 4, emoji: "🙂", label: "Good", color: "text-lime-500" },
  { value: 5, emoji: "😊", label: "Very Good", color: "text-green-500" }
]

export function MoodScale({
  value,
  onChange,
  disabled = false,
  size = "md",
  showLabels = true
}: MoodScaleProps) {
  const [selectedValue, setSelectedValue] = useState(value || 0)

  const handleSelect = (newValue: number) => {
    if (disabled) return
    setSelectedValue(newValue)
    onChange?.(newValue)
  }

  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-2">
        {MOOD_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => handleSelect(level.value)}
            disabled={disabled}
            className={cn(
              "rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              sizeClasses[size],
              "flex items-center justify-center",
              selectedValue === level.value
                ? "border-blue-500 bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Mood level ${level.value}: ${level.label}`}
            aria-pressed={selectedValue === level.value}
          >
            <span className={cn(
              selectedValue === level.value ? "text-blue-600" : level.color
            )}>
              {level.emoji}
            </span>
          </button>
        ))}
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Very Low</span>
          <span>Low</span>
          <span>Neutral</span>
          <span>Good</span>
          <span>Very Good</span>
        </div>
      )}

      {selectedValue > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Selected: {MOOD_LEVELS.find(l => l.value === selectedValue)?.label}
          </p>
        </div>
      )}
    </div>
  )
}