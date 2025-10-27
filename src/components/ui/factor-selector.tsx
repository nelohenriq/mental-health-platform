"use client"

import { useState, useEffect } from "react"
import { X, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Factor {
  factor: string
  count?: number
  category: string
  type: string
  isPredefined: boolean
}

interface FactorSelectorProps {
  selectedFactors: string[]
  onChange: (factors: string[]) => void
  maxFactors?: number
  placeholder?: string
  disabled?: boolean
}

export function FactorSelector({
  selectedFactors,
  onChange,
  maxFactors = 5,
  placeholder = "Add mood factors...",
  disabled = false
}: FactorSelectorProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<Factor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch factor suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/mood/factors?limit=10`)
        if (response.ok) {
          const data = await response.json()
          const filtered = data.factors.filter((factor: Factor) =>
            factor.factor.toLowerCase().includes(inputValue.toLowerCase()) &&
            !selectedFactors.includes(factor.factor)
          )
          setSuggestions(filtered.slice(0, 8))
        }
      } catch (error) {
        console.error("Failed to fetch factor suggestions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [inputValue, selectedFactors])

  const addFactor = (factor: string) => {
    if (selectedFactors.length >= maxFactors) return
    if (!selectedFactors.includes(factor)) {
      onChange([...selectedFactors, factor])
    }
    setInputValue("")
    setShowSuggestions(false)
  }

  const removeFactor = (factor: string) => {
    onChange(selectedFactors.filter(f => f !== factor))
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowSuggestions(value.length >= 2)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      addFactor(inputValue.trim())
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected Factors */}
      {selectedFactors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFactors.map((factor) => (
            <span
              key={factor}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {factor}
              <button
                onClick={() => removeFactor(factor)}
                disabled={disabled}
                className="hover:bg-blue-200 rounded-full p-0.5"
                aria-label={`Remove ${factor}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length >= 2)}
            placeholder={selectedFactors.length >= maxFactors ? "Maximum factors reached" : placeholder}
            disabled={disabled || selectedFactors.length >= maxFactors}
            className={cn(
              "w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selectedFactors.length >= maxFactors && "bg-gray-50"
            )}
            aria-label="Add mood factor"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.factor}
                onClick={() => addFactor(suggestion.factor)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{suggestion.factor}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      suggestion.category === 'positive' && "bg-green-100 text-green-800",
                      suggestion.category === 'negative' && "bg-red-100 text-red-800",
                      suggestion.category === 'neutral' && "bg-gray-100 text-gray-800"
                    )}>
                      {suggestion.category}
                    </span>
                    {suggestion.count && (
                      <span className="text-xs text-gray-500">
                        {suggestion.count}x
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        {selectedFactors.length}/{maxFactors} factors selected.
        {selectedFactors.length < maxFactors && " Type to search or add custom factors."}
      </p>
    </div>
  )
}