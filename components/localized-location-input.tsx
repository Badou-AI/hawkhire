"use client"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LocalizedText {
  en: string
  fr?: string
}

interface LocalizedLocation {
  city: LocalizedText
  state: LocalizedText
  country: LocalizedText
  postal_code: LocalizedText
}

interface LocalizedLocationInputProps {
  value: LocalizedLocation
  onChange: (value: LocalizedLocation) => void
}

export function LocalizedLocationInput({
  value,
  onChange,
}: LocalizedLocationInputProps) {
  const handleFieldChange = (
    field: keyof LocalizedLocation,
    lang: "en" | "fr",
    newValue: string
  ) => {
    onChange({
      ...value,
      [field]: {
        ...value[field],
        [lang]: newValue,
      },
    })
  }

  return (
    <Tabs defaultValue="en" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="fr">French</TabsTrigger>
      </TabsList>

      {/* English Fields */}
      <TabsContent value="en">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input
              value={value.city.en}
              onChange={(e) => handleFieldChange("city", "en", e.target.value)}
              placeholder="Enter city name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">State/Province</label>
            <Input
              value={value.state.en}
              onChange={(e) => handleFieldChange("state", "en", e.target.value)}
              placeholder="Enter state or province"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Input
              value={value.country.en}
              onChange={(e) => handleFieldChange("country", "en", e.target.value)}
              placeholder="Enter country"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Postal Code</label>
            <Input
              value={value.postal_code.en}
              onChange={(e) => handleFieldChange("postal_code", "en", e.target.value)}
              placeholder="Enter postal code"
            />
          </div>
        </div>
      </TabsContent>

      {/* French Fields */}
      <TabsContent value="fr">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <Input
              value={value.city.fr || ""}
              onChange={(e) => handleFieldChange("city", "fr", e.target.value)}
              placeholder="Entrez le nom de la ville"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">État/Province</label>
            <Input
              value={value.state.fr || ""}
              onChange={(e) => handleFieldChange("state", "fr", e.target.value)}
              placeholder="Entrez l'état ou la province"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pays</label>
            <Input
              value={value.country.fr || ""}
              onChange={(e) => handleFieldChange("country", "fr", e.target.value)}
              placeholder="Entrez le pays"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Code Postal</label>
            <Input
              value={value.postal_code.fr || ""}
              onChange={(e) => handleFieldChange("postal_code", "fr", e.target.value)}
              placeholder="Entrez le code postal"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
} 