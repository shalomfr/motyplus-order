"use client"

import React, { useState, useRef, useEffect } from "react"

const DOMAIN_SUGGESTIONS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "walla.co.il",
  "walla.com",
  "013.net",
  "bezeqint.net",
  "netvision.net.il",
  "zahav.net.il",
  "icloud.com",
  "live.com",
]

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onValueChange?: (value: string) => void
}

export function EmailInput({ className, onValueChange, onChange, onBlur, value, ...props }: EmailInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateSuggestions = (val: string) => {
    const atIndex = val.indexOf("@")
    if (atIndex === -1 || atIndex === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const localPart = val.substring(0, atIndex)
    const domainPart = val.substring(atIndex + 1)

    const filtered = DOMAIN_SUGGESTIONS.filter((d) =>
      d.startsWith(domainPart.toLowerCase())
    )

    if (filtered.length === 0 || (filtered.length === 1 && filtered[0] === domainPart)) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setSuggestions(filtered.map((d) => `${localPart}@${d}`))
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const fireChange = (val: string) => {
    onValueChange?.(val)
    if (inputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      nativeInputValueSetter?.call(inputRef.current, val)
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }))
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSuggestions(e.target.value)
    onChange?.(e)
    onValueChange?.(e.target.value)
  }

  const selectSuggestion = (suggestion: string) => {
    setShowSuggestions(false)
    fireChange(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[selectedIndex])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    } else if (e.key === "Tab" && suggestions.length > 0) {
      const idx = selectedIndex >= 0 ? selectedIndex : 0
      selectSuggestion(suggestions[idx])
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => setShowSuggestions(false), 150)

    const val = e.target.value.trim()
    if (val && !val.includes("@")) {
      fireChange(val + "@gmail.com")
    }

    onBlur?.(e)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="email"
        className={className}
        dir="ltr"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="off"
        value={value}
        {...props}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto"
          dir="ltr"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-left ${
                index === selectedIndex ? "bg-blue-100" : ""
              }`}
              onMouseDown={() => selectSuggestion(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
