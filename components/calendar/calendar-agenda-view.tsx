"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarEvent } from "./calendar-grid"

const startOfDay = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const addDays = (value: Date, amount: number) => {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

const formatTime = (date: Date) =>
  date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

interface CalendarAgendaViewProps {
  events: CalendarEvent[]
  rangeDays?: number
  title?: string
}

export function CalendarAgendaView({ events, rangeDays, title }: CalendarAgendaViewProps) {
  const effectiveRangeDays = typeof rangeDays === "number" ? rangeDays : null
  const hasRange = effectiveRangeDays !== null
  const [rangeStart, setRangeStart] = useState(() => startOfDay(new Date()))
  const rangeEnd = hasRange ? addDays(rangeStart, effectiveRangeDays - 1) : null

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
    if (!hasRange || !rangeEnd) {
      return sorted
    }
    return sorted.filter((event) => {
      const day = startOfDay(event.start)
      return day >= rangeStart && day <= rangeEnd
    })
  }, [events, hasRange, rangeEnd, rangeStart])

  const groupedEvents = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    filteredEvents.forEach((event) => {
      const key = startOfDay(event.start).getTime()
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([key, list]) => ({
        date: new Date(key),
        events: list,
      }))
  }, [filteredEvents])

  const shiftRange = (offset: number) => {
    if (!hasRange || !effectiveRangeDays) return
    setRangeStart((prev) => addDays(prev, offset * effectiveRangeDays))
  }

  const formatRangeLabel = () => {
    if (!hasRange || !rangeEnd) return ""
    const startLabel = rangeStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    const endLabel = rangeEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    return `${startLabel} - ${endLabel}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold">
            {title ?? (hasRange ? `Vue ${effectiveRangeDays}j` : "Liste")}
          </h2>
          {hasRange && <p className="text-sm text-muted-foreground capitalize">{formatRangeLabel()}</p>}
        </div>
        {hasRange && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRangeStart(startOfDay(new Date()))}>
              Aujourd&apos;hui
            </Button>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => shiftRange(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => shiftRange(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {groupedEvents.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Aucun evenement sur cette periode.
          </div>
        ) : (
          groupedEvents.map((group) => (
            <div key={group.date.toISOString()} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="text-sm font-semibold capitalize">{formatDayLabel(group.date)}</div>
              <div className="space-y-2">
                {group.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-md border px-3 py-2 text-sm shadow-xs"
                    style={{ borderLeftWidth: 3, borderLeftColor: event.color || "transparent" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </span>
                    </div>
                    {event.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
