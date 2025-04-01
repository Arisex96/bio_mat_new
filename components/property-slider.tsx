"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { MaterialRequirements } from "@/components/material-selector"

interface PropertySliderProps {
  property: keyof MaterialRequirements
  displayName: string
  value: number
  weight: number
  min: number
  max: number
  onChange: (property: keyof MaterialRequirements, field: "value" | "weight", value: number) => void
}

export const PropertySlider = ({ property, displayName, value, weight, min, max, onChange }: PropertySliderProps) => {
  // Ensure min and max are different
  if (min === max) {
    if (min === 0) {
      min = 0
      max = 0.001
    } else {
      min = min * 0.99
      max = max * 1.01
    }
  }

  // Ensure value is within range
  const safeValue = Math.max(min, Math.min(max, value))

  return (
    <div className="mb-6">
      <div className="mb-2">
        <Label>{displayName}</Label>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Target value: {safeValue.toLocaleString()}</span>
        </div>
        <Slider
          min={min}
          max={max}
          step={(max - min) / 100}
          value={[safeValue]}
          onValueChange={(values) => onChange(property, "value", values[0])}
        />
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Importance: {weight.toFixed(1)}</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={[weight]}
          onValueChange={(values) => onChange(property, "weight", values[0])}
        />
      </div>
    </div>
  )
}

