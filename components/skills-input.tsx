"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SkillsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function SkillsInput({ value, onChange, placeholder }: SkillsInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim()
    if (trimmedSkill && !value.includes(trimmedSkill)) {
      onChange([...value, trimmedSkill])
    }
    setInputValue("")
  }

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addSkill(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeSkill(value[value.length - 1])
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {value.map((skill) => (
        <Badge key={skill} variant="secondary" className="h-6">
          {skill}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
            onClick={() => removeSkill(skill)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {skill}</span>
          </Button>
        </Badge>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addSkill(inputValue)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-w-[120px]"
      />
    </div>
  )
} 