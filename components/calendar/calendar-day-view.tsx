"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarEvent } from "./calendar-grid"

const HOURS = Array.from({ length: 24 }, (_, index) => index)

const startOfDay = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const isSameDay = (left: Date, right: Date) => {
  return startOfDay(left).getTime() === startOfDay(right).getTime()
}

export function CalendarDayView({ events }: { events: CalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const dayEvents = useMemo(() => {
    return events
      .filter((event) => isSameDay(event.start, currentDate))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate])

  const eventsByHour = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    HOURS.forEach((hour) => map.set(hour, []))
    dayEvents.forEach((event) => {
      const hour = event.start.getHours()
      const list = map.get(hour)
      if (list) list.push(event)
    })
    return map
  }, [dayEvents])

  const shiftDay = (offset: number) => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + offset)
    setCurrentDate(next)
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold">Vue 24h</h2>
          <p className="text-sm text-muted-foreground capitalize">{formatDayLabel(currentDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Aujourd&apos;hui
          </Button>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => shiftDay(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shiftDay(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {HOURS.map((hour) => {
          const hourEvents = eventsByHour.get(hour) ?? []
          return (
            <div key={hour} className="grid grid-cols-[72px_1fr] border-b last:border-b-0">
              <div className="px-3 py-3 text-xs text-muted-foreground bg-muted/40">{`${String(hour).padStart(2, "0")}:00`}</div>
              <div className="px-3 py-2 space-y-2">
                {hourEvents.length === 0 ? (
                  <div className="h-6" />
                ) : (
                  hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border px-3 py-2 text-sm shadow-xs"
                      style={{ borderLeftWidth: 4, borderLeftColor: event.color || "transparent" }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                      {event.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
