"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Factor {
  factor: string;
  count?: number;
  category: string;
  type: string;
  isPredefined: boolean;
}

interface FactorSelectorProps {
  selectedFactors: string[];
  onChange: (factors: string[]) => void;
  maxFactors?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function FactorSelector({
  selectedFactors,
  onChange,
  maxFactors = 5,
  placeholder = "Add mood factors...",
  disabled = false,
  required = false,
  error,
}: FactorSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch factor suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/mood/factors?limit=10`);
        if (response.ok) {
          const data = await response.json();
          const filtered = data.factors.filter(
            (factor: Factor) =>
              factor.factor.toLowerCase().includes(inputValue.toLowerCase()) &&
              !selectedFactors.includes(factor.factor)
          );
          setSuggestions(filtered.slice(0, 8));
        }
      } catch (error) {
        console.error("Failed to fetch factor suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, selectedFactors]);

  const addFactor = (factor: string) => {
    if (selectedFactors.length >= maxFactors) return;
    if (!selectedFactors.includes(factor)) {
      onChange([...selectedFactors, factor]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const removeFactor = (factor: string) => {
    onChange(selectedFactors.filter((f) => f !== factor));
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.length >= 2);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        addFactor(inputValue.trim());
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
      return;
    }

    // Handle suggestion navigation
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          addFactor(suggestions[focusedIndex].factor);
        } else if (inputValue.trim()) {
          addFactor(inputValue.trim());
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (factor: string) => {
    addFactor(factor);
  };

  return (
    <div className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">
          What factors are affecting your mood?{" "}
          {required && <span className="text-red-500">*</span>}
        </legend>

        {/* Selected Factors */}
        {selectedFactors.length > 0 && (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Selected mood factors"
          >
            {selectedFactors.map((factor) => (
              <span
                key={factor}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
              >
                {factor}
                <button
                  onClick={() => removeFactor(factor)}
                  disabled={disabled}
                  className="hover:bg-primary-200 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={`Remove ${factor} from selected factors`}
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
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(inputValue.length >= 2)}
              onBlur={() => {
                // Delay hiding suggestions to allow for clicks
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder={
                selectedFactors.length >= maxFactors
                  ? `Maximum of ${maxFactors} factors reached`
                  : placeholder
              }
              disabled={disabled || selectedFactors.length >= maxFactors}
              className={cn(
                // Touch-friendly sizing (44px height)
                "w-full h-11 pl-10 pr-4 text-base",
                // Prevents zoom on iOS
                "font-normal",
                // Border and focus states
                "border border-gray-300 rounded-md",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:border-primary-500",
                // Error state
                error &&
                  "border-red-500 focus:ring-red-500 focus:border-red-500",
                // Disabled state
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
                // Selection styling
                "selection:bg-primary-100"
              )}
              aria-label="Add mood factor"
              aria-expanded={showSuggestions}
              aria-haspopup="listbox"
              aria-describedby={error ? "factor-error" : undefined}
              aria-invalid={!!error}
              role="combobox"
              aria-activedescendant={
                focusedIndex >= 0 ? `suggestion-${focusedIndex}` : undefined
              }
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
              role="listbox"
              aria-label="Factor suggestions"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.factor}
                  id={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion.factor)}
                  className={cn(
                    "w-full px-4 py-3 text-left focus:outline-none focus:bg-gray-50",
                    focusedIndex === index && "bg-primary-50"
                  )}
                  role="option"
                  aria-selected={focusedIndex === index}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.factor}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          suggestion.category === "positive" &&
                            "bg-green-100 text-green-800",
                          suggestion.category === "negative" &&
                            "bg-red-100 text-red-800",
                          suggestion.category === "neutral" &&
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {suggestion.category}
                      </span>
                      {suggestion.count && (
                        <span className="text-xs text-gray-500 font-medium">
                          {suggestion.count}x used
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
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              aria-hidden="true"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500" id="factor-help">
          {selectedFactors.length}/{maxFactors} factors selected.
          {selectedFactors.length < maxFactors &&
            " Type to search or add custom factors."}
        </p>

        {/* Error Message */}
        {error && (
          <p id="factor-error" className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
}
