"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MoodScaleProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  required?: boolean;
  error?: string;
}

const MOOD_LEVELS = [
  {
    value: 1,
    emoji: "😢",
    label: "Very Low",
    description: "Feeling extremely down or distressed",
  },
  {
    value: 2,
    emoji: "😞",
    label: "Low",
    description: "Feeling quite low or sad",
  },
  {
    value: 3,
    emoji: "😐",
    label: "Neutral",
    description: "Feeling okay, neither good nor bad",
  },
  {
    value: 4,
    emoji: "🙂",
    label: "Good",
    description: "Feeling pretty good overall",
  },
  {
    value: 5,
    emoji: "😊",
    label: "Very Good",
    description: "Feeling excellent and positive",
  },
];

export function MoodScale({
  value,
  onChange,
  disabled = false,
  size = "md",
  showLabels = true,
  required = false,
  error,
}: MoodScaleProps) {
  const [selectedValue, setSelectedValue] = useState(value || 0);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const handleSelect = (newValue: number) => {
    if (disabled) return;
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        handleSelect(MOOD_LEVELS[index].value);
        break;
      case "ArrowRight":
        event.preventDefault();
        const nextIndex = Math.min(index + 1, MOOD_LEVELS.length - 1);
        setFocusedIndex(nextIndex);
        break;
      case "ArrowLeft":
        event.preventDefault();
        const prevIndex = Math.max(index - 1, 0);
        setFocusedIndex(prevIndex);
        break;
    }
  };

  const sizeClasses = {
    sm: "w-12 h-12 text-xl", // 48px - touch friendly
    md: "w-16 h-16 text-2xl", // 64px - touch friendly
    lg: "w-20 h-20 text-3xl", // 80px - touch friendly
  };

  return (
    <div className="space-y-4">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-gray-700">
          How are you feeling?{" "}
          {required && <span className="text-red-500">*</span>}
        </legend>

        <div className="flex justify-center space-x-2" role="radiogroup">
          {MOOD_LEVELS.map((level, index) => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleSelect(level.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              disabled={disabled}
              className={cn(
                "rounded-full border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                sizeClasses[size],
                "flex items-center justify-center",
                selectedValue === level.value
                  ? "border-primary-500 bg-primary-50 shadow-lg"
                  : "border-gray-200 hover:border-primary-300",
                disabled && "opacity-50 cursor-not-allowed",
                focusedIndex === index &&
                  "ring-2 ring-primary-500 ring-offset-2"
              )}
              aria-label={`Mood level ${level.value}: ${level.label}`}
              aria-describedby={`mood-description-${level.value}`}
              aria-pressed={selectedValue === level.value}
              role="radio"
              aria-checked={selectedValue === level.value}
            >
              <span
                className={cn(
                  selectedValue === level.value
                    ? "text-primary-600"
                    : "text-gray-600"
                )}
              >
                {level.emoji}
              </span>
            </button>
          ))}
        </div>

        {showLabels && (
          <div className="flex justify-between text-xs text-gray-500 px-1">
            {MOOD_LEVELS.map((level) => (
              <div key={level.value} className="text-center max-w-16">
                <div id={`mood-description-${level.value}`} className="sr-only">
                  {level.description}
                </div>
                <div className="font-medium">{level.label}</div>
              </div>
            ))}
          </div>
        )}

        {selectedValue > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Selected:{" "}
              <span className="font-medium text-gray-900">
                {MOOD_LEVELS.find((l) => l.value === selectedValue)?.label}
              </span>
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
}
