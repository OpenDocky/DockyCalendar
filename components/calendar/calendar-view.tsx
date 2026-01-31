"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Calendar, LogOut, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { CalendarGrid } from "./calendar-grid"
import { CalendarStats } from "./calendar-stats"
import { CalendarDayView } from "./calendar-day-view"
import { CalendarWeekView } from "./calendar-week-view"
import { CalendarAgendaView } from "./calendar-agenda-view"
import { GoogleCalendarSync } from "./google-calendar-sync"
import type { CalendarEvent } from "./calendar-grid"

type CalendarViewMode = "month" | "day" | "week" | "30days" | "agenda"

export function CalendarView() {
  const { user, logout } = useAuth()
  const [showSync, setShowSync] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month")

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleEventsImported = (importedEvents: CalendarEvent[]) => {
    setEvents((prevEvents) => {
      const newEvents = [...prevEvents]
      importedEvents.forEach((importedEvent) => {
        const exists = newEvents.some((e) => e.googleEventId === importedEvent.googleEventId)
        if (!exists) {
          newEvents.push(importedEvent)
        }
      })
      return newEvents
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">DockyCalendar</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={() => setShowSync(!showSync)}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sync </span>Google
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showSync} onOpenChange={setShowSync}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none" showCloseButton={false}>
          <GoogleCalendarSync
            onClose={() => setShowSync(false)}
            events={events}
            onEventsImported={handleEventsImported}
          />
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-6">
        <CalendarStats events={events} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">Vues</div>
          <ButtonGroup className="flex-wrap">
            <Button
              size="sm"
              variant={viewMode === "month" ? "default" : "outline"}
              onClick={() => setViewMode("month")}
            >
              Mois
            </Button>
            <Button
              size="sm"
              variant={viewMode === "day" ? "default" : "outline"}
              onClick={() => setViewMode("day")}
            >
              24h
            </Button>
            <Button
              size="sm"
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
            >
              7j
            </Button>
            <Button
              size="sm"
              variant={viewMode === "30days" ? "default" : "outline"}
              onClick={() => setViewMode("30days")}
            >
              30j
            </Button>
            <Button
              size="sm"
              variant={viewMode === "agenda" ? "default" : "outline"}
              onClick={() => setViewMode("agenda")}
            >
              Liste
            </Button>
          </ButtonGroup>
        </div>

        <div className="mt-6">
          {viewMode === "month" && <CalendarGrid events={events} onEventsChange={setEvents} />}
          {viewMode === "day" && <CalendarDayView events={events} />}
          {viewMode === "week" && <CalendarWeekView events={events} />}
          {viewMode === "30days" && <CalendarAgendaView events={events} rangeDays={30} title="Vue 30j" />}
          {viewMode === "agenda" && <CalendarAgendaView events={events} title="Liste des evenements" />}
        </div>
      </main>
    </div>
  )
}
