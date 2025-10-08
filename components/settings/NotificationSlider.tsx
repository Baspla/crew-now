"use client"

import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { useMemo, useState } from "react"
import { CheckCircle2, Circle } from "lucide-react"

type SliderProps = React.ComponentProps<typeof Slider>

type NotificationSliderProps = {
  initialLevel?: number
  name?: string // for form submission
  value?: number // optional controlled value
  onLevelChange?: (level: number) => void
} & Omit<SliderProps, 'value' | 'onValueChange'>

export function NotificationSlider({ className, initialLevel = 0, name, value, onLevelChange, ...props }: NotificationSliderProps) {
  // Level 0..3: 0=nothing, 1=daily post time, 2=+others posted, 3=+all activity
  const [internalLevel, setInternalLevel] = useState<number>(initialLevel)
  const level = value ?? internalLevel

  const checklist = useMemo(
    () => [
      { label: "Tägliche Postzeit", enabledAtLevel: 1 },
      { label: "Wenn andere Nutzer gepostet haben", enabledAtLevel: 2 },
      { label: "Alles (Reaktionen, Kommentare, usw.)", enabledAtLevel: 3 },
    ],
    []
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <Slider
          aria-label="Benachrichtigungsstufe"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={level}
          aria-valuetext={`Stufe ${level} von 3`}
          value={[level]}
          min={0}
          max={3}
          step={1}
          onValueChange={(val) => {
            const next = val[0] ?? 0
            if (onLevelChange) onLevelChange(next)
            else setInternalLevel(next)
          }}
          className="max-w-md mt-2"
          {...props}
        />
      </div>

      {name ? (
        <input type="hidden" name={name} value={String(level)} />
      ) : null}

      <ul className="mt-1 space-y-2" aria-live="polite">
        {checklist.map((item, idx) => {
          const checked = level >= item.enabledAtLevel
          const Icon = checked ? CheckCircle2 : Circle
          return (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <Icon
                className={cn(
                  "h-5 w-5",
                  checked ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span className={cn(checked ? "" : "text-muted-foreground")}>{item.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
