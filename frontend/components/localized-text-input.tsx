"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LocalizedText {
  en?: string
  fr?: string
}

interface LocalizedTextInputProps {
  value: LocalizedText
  onChange: (value: LocalizedText) => void
  placeholder?: {
    en?: string
    fr?: string
  }
  multiline?: boolean
}

export function LocalizedTextInput({
  value,
  onChange,
  placeholder,
  multiline = false,
}: LocalizedTextInputProps) {
  const InputComponent = multiline ? Textarea : Input

  return (
    <Tabs defaultValue="en" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="fr">French</TabsTrigger>
      </TabsList>
      <TabsContent value="en">
        <InputComponent
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder={placeholder?.en}
        />
      </TabsContent>
      <TabsContent value="fr">
        <InputComponent
          value={value.fr || ""}
          onChange={(e) => onChange({ ...value, fr: e.target.value })}
          placeholder={placeholder?.fr}
        />
      </TabsContent>
    </Tabs>
  )
} 