"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { CalendarEvent } from "./calendar-grid"
import { Plus, Trash2, Edit2, ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGoogleCalendar } from "@/hooks/use-google-calendar"

interface EventDialogProps {
  date: Date
  events: CalendarEvent[]
  onClose: () => void
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void
  onUpdateEvent: (eventId: string, event: Partial<CalendarEvent>) => void
  onDeleteEvent: (eventId: string) => void
}

const EVENT_COLORS = [
  { name: "Bleu", value: "oklch(0.55 0.20 264)" },
  { name: "Vert", value: "oklch(0.60 0.20 140)" },
  { name: "Rouge", value: "oklch(0.55 0.22 25)" },
  { name: "Orange", value: "oklch(0.65 0.20 60)" },
  { name: "Violet", value: "oklch(0.55 0.20 300)" },
]

export function EventDialog({ date, events, onClose, onAddEvent, onUpdateEvent, onDeleteEvent }: EventDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[0].value)
  const [repeatFrequency, setRepeatFrequency] = useState<"none" | "daily" | "weekly" | "monthly">("none")
  const [repeatUntil, setRepeatUntil] = useState("")
  const { exportEvent, deleteGoogleEvent, isGoogleConnected } = useGoogleCalendar()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const start = new Date(date)
    start.setHours(startHour, startMinute, 0)

    const end = new Date(date)
    end.setHours(endHour, endMinute, 0)

    if (editingEventId) {
      onUpdateEvent(editingEventId, {
        title,
        description,
        start,
        end,
        color: selectedColor,
      })
      setEditingEventId(null)
    } else {
      const baseEvent = {
        title,
        description,
        start,
        end,
        color: selectedColor,
      }

      if (repeatFrequency === "none" || !repeatUntil) {
        onAddEvent(baseEvent)
      } else {
        const untilDate = parseDateInput(repeatUntil)
        if (!untilDate) {
          onAddEvent(baseEvent)
          resetForm()
          setShowAddForm(false)
          return
        }
        untilDate.setHours(23, 59, 59, 999)

        let currentStart = new Date(start)
        let currentEnd = new Date(end)

        for (let i = 0; i < 366; i++) {
          if (currentStart > untilDate) break

          onAddEvent({
            ...baseEvent,
            start: new Date(currentStart),
            end: new Date(currentEnd),
          })

          if (repeatFrequency === "daily") {
            currentStart.setDate(currentStart.getDate() + 1)
            currentEnd.setDate(currentEnd.getDate() + 1)
          } else if (repeatFrequency === "weekly") {
            currentStart.setDate(currentStart.getDate() + 7)
            currentEnd.setDate(currentEnd.getDate() + 7)
          } else {
            currentStart.setMonth(currentStart.getMonth() + 1)
            currentEnd.setMonth(currentEnd.getMonth() + 1)
          }
        }
      }
    }

    resetForm()
    setShowAddForm(false)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartTime("09:00")
    setEndTime("10:00")
    setSelectedColor(EVENT_COLORS[0].value)
    setRepeatFrequency("none")
    setRepeatUntil("")
  }

  const handleEdit = (event: CalendarEvent) => {
    setTitle(event.title)
    setDescription(event.description || "")
    setStartTime(event.start.toTimeString().slice(0, 5))
    setEndTime(event.end.toTimeString().slice(0, 5))
    setSelectedColor(event.color || EVENT_COLORS[0].value)
    setRepeatFrequency("none")
    setRepeatUntil("")
    setEditingEventId(event.id)
    setShowAddForm(true)
  }

  const handleDelete = async (event: CalendarEvent) => {
    if (event.googleEventId && isGoogleConnected) {
      try {
        await deleteGoogleEvent(event.googleEventId)
      } catch (error) {
        console.error("Error deleting from Google Calendar:", error)
      }
    }
    onDeleteEvent(event.id)
  }

  const handleExportToGoogle = async (event: CalendarEvent) => {
    if (!event.googleEventId && isGoogleConnected) {
      try {
        await exportEvent(event)
        onUpdateEvent(event.id, { googleEventId: "exported" })
      } catch (error) {
        console.error("Error exporting to Google Calendar:", error)
      }
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingEventId(null)
    resetForm()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatEventTime = (start: Date, end: Date) => {
    return `${start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`
  }

  const formatDateInput = (value: Date) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, "0")
    const day = String(value.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const parseDateInput = (value: string) => {
    const [year, month, day] = value.split("-").map(Number)
    if (!year || !month || !day) {
      return null
    }
    return new Date(year, month - 1, day)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">{formatDate(date)}</DialogTitle>
          <DialogDescription>Gérez vos événements pour cette journée</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Existing events */}
            {events.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Événements ({events.length})</h3>
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{formatEventTime(event.start, event.end)}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      )}
                      {event.googleEventId && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                          <ExternalLink className="h-3 w-3" />
                          Synchronisé avec Google Calendar
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!event.googleEventId && isGoogleConnected && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportToGoogle(event)}
                          title="Exporter vers Google Calendar"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(event)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit event form */}
            {showAddForm ? (
              <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold">{editingEventId ? "Modifier l'événement" : "Nouvel événement"}</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre de l&apos;événement *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Réunion, rendez-vous..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Heure de début</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">Heure de fin</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails de l'événement..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <div className="flex gap-2">
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color.value,
                          borderColor: selectedColor === color.value ? "oklch(var(--primary))" : "transparent",
                        }}
                        onClick={() => setSelectedColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {!editingEventId && (
                  <div className="space-y-2">
                    <Label>Répéter l&apos;événement</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Select
                        value={repeatFrequency}
                        onValueChange={(value) => {
                          const nextValue = value as "none" | "daily" | "weekly" | "monthly"
                          setRepeatFrequency(nextValue)
                          if (nextValue !== "none" && !repeatUntil) {
                            const defaultUntil = new Date(date)
                            defaultUntil.setDate(defaultUntil.getDate() + 7)
                            setRepeatUntil(formatDateInput(defaultUntil))
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir une répétition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ne pas répéter</SelectItem>
                          <SelectItem value="daily">Chaque jour</SelectItem>
                          <SelectItem value="weekly">Chaque semaine</SelectItem>
                          <SelectItem value="monthly">Chaque mois</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-1">
                        <Label htmlFor="repeat-until" className="text-xs text-muted-foreground">
                          Jusqu&apos;au
                        </Label>
                        <Input
                          id="repeat-until"
                          type="date"
                          value={repeatUntil}
                          onChange={(e) => setRepeatUntil(e.target.value)}
                          disabled={repeatFrequency === "none"}
                          min={formatDateInput(date)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingEventId ? "Enregistrer" : "Créer l'événement"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un événement
              </Button>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
