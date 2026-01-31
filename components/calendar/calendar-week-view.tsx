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

const getWeekStart = (value: Date) => {
  const date = startOfDay(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(date, diff)
}

const isSameDay = (left: Date, right: Date) => {
  return startOfDay(left).getTime() === startOfDay(right).getTime()
}

export function CalendarWeekView({ events }: { events: CalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate])
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  }, [weekStart])

  const formatDayLabel = (date: Date) =>
    date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })

  const formatWeekRange = () => {
    const startLabel = weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    const endLabel = addDays(weekStart, 6).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    return `${startLabel} - ${endLabel}`
  }

  const shiftWeek = (offset: number) => {
    const next = addDays(currentDate, offset * 7)
    setCurrentDate(next)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold">Vue 7j</h2>
          <p className="text-sm text-muted-foreground">{formatWeekRange()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Aujourd&apos;hui
          </Button>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shiftWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {weekDays.map((day) => {
          const dayEvents = events
            .filter((event) => isSameDay(event.start, day))
            .sort((a, b) => a.start.getTime() - b.start.getTime())

          return (
            <div key={day.toISOString()} className="rounded-lg border bg-card p-3">
              <div className="mb-3">
                <div className="text-sm font-semibold capitalize">{formatDayLabel(day)}</div>
                <div className="text-xs text-muted-foreground">{day.getFullYear()}</div>
              </div>
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Aucun evenement</div>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border px-2 py-2 text-sm shadow-xs"
                      style={{ borderLeftWidth: 3, borderLeftColor: event.color || "transparent" }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
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
