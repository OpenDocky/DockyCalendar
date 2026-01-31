import type { User } from "firebase/auth"
import { getAuth } from "firebase/auth"
import { getStoredGoogleAccessToken, setStoredGoogleAccessToken } from "./google-token"

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status?: string
  htmlLink?: string
}

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"

export class GoogleCalendarService {
  private accessToken: string | null = null
  private user: User | null = null

  constructor(user: User | null) {
    this.user = user
    if (user) {
      this.initializeAccessToken(user)
    }
  }

  private async initializeAccessToken(user: User) {
    try {
      const storedToken = getStoredGoogleAccessToken()
      if (storedToken) {
        this.accessToken = storedToken
        return
      }

      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("No authenticated user")
      }

      const providerData = user.providerData.find((p) => p.providerId === "google.com")

      if (!providerData) {
        throw new Error("User not signed in with Google")
      }

      const userWithToken = currentUser as any
      if (userWithToken.accessToken) {
        this.accessToken = userWithToken.accessToken
        setStoredGoogleAccessToken(this.accessToken)
      } else {
        await currentUser.reload()
        const reloadedUser = auth.currentUser as any
        this.accessToken = reloadedUser?.accessToken || null
        if (this.accessToken) {
          setStoredGoogleAccessToken(this.accessToken)
        }
      }

      console.log("[v0] Access token initialized:", !!this.accessToken)

      if (!this.accessToken) {
        console.error("[v0] No OAuth access token found in user object:", Object.keys(userWithToken))
      }
    } catch (error) {
      console.error("[v0] Error getting access token:", error)
      this.accessToken = null
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.user) return

    try {
      const storedToken = getStoredGoogleAccessToken()
      if (storedToken) {
        this.accessToken = storedToken
        return
      }

      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) return

      await currentUser.reload()
      const userWithToken = currentUser as any

      if (userWithToken.accessToken) {
        this.accessToken = userWithToken.accessToken
        setStoredGoogleAccessToken(this.accessToken)
        console.log("[v0] Access token refreshed")
      }
    } catch (error) {
      console.error("[v0] Error refreshing access token:", error)
    }
  }

  async fetchEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      console.error("[v0] No access token available for fetchEvents")
      throw new Error("Session Google expirée. Reconnectez-vous pour synchroniser.")
    }

    try {
      const params = new URLSearchParams({
        maxResults: "100",
        orderBy: "startTime",
        singleEvents: "true",
        ...(timeMin && { timeMin: timeMin.toISOString() }),
        ...(timeMax && { timeMax: timeMax.toISOString() }),
      })

      console.log("[v0] Fetching events with token:", this.accessToken.substring(0, 20) + "...")

      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Response status:", response.status)

      if (response.status === 401) {
        console.log("[v0] Got 401, attempting to refresh token...")
        await this.refreshAccessToken()

        const retryResponse = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!retryResponse.ok) {
          setStoredGoogleAccessToken(null)
          throw new Error("Session Google expirée. Reconnectez-vous pour synchroniser.")
        }

        const data = await retryResponse.json()
        return data.items || []
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        throw new Error(`Failed to fetch events: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Fetched events count:", data.items?.length || 0)
      return data.items || []
    } catch (error) {
      console.error("[v0] Error fetching Google Calendar events:", error)
      throw error
    }
  }

  async createEvent(event: {
    summary: string
    description?: string
    start: Date
    end: Date
    timeZone?: string
  }): Promise<GoogleCalendarEvent> {
    if (!this.accessToken) {
      throw new Error("Session Google expirée. Reconnectez-vous pour synchroniser.")
    }

    try {
      const eventData = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: event.timeZone || "Europe/Paris",
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: event.timeZone || "Europe/Paris",
        },
      }

      console.log("[v0] Creating event:", eventData.summary)

      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (response.status === 401) {
        await this.refreshAccessToken()

        const retryResponse = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        })

        if (!retryResponse.ok) {
          setStoredGoogleAccessToken(null)
          throw new Error("Session Google expirée. Reconnectez-vous pour synchroniser.")
        }

        return await retryResponse.json()
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        throw new Error(`Failed to create event: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("[v0] Event created:", result.id)
      return result
    } catch (error) {
      console.error("[v0] Error creating Google Calendar event:", error)
      throw error
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error("Session Google expirée. Reconnectez-vous pour synchroniser.")
    }

    try {
      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error)
      throw error
    }
  }
}

export function convertGoogleEventToCalendarEvent(googleEvent: GoogleCalendarEvent) {
  const startDateTime = googleEvent.start.dateTime || googleEvent.start.date
  const endDateTime = googleEvent.end.dateTime || googleEvent.end.date

  if (!startDateTime || !endDateTime) {
    return null
  }

  return {
    id: `google-${googleEvent.id}`,
    googleEventId: googleEvent.id,
    title: googleEvent.summary || "Sans titre",
    description: googleEvent.description,
    start: new Date(startDateTime),
    end: new Date(endDateTime),
    color: "oklch(0.60 0.20 140)", // Green color for Google Calendar events
  }
}
