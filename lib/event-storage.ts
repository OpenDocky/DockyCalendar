import { db } from "./firebase"
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from "firebase/firestore"
import type { CalendarEvent } from "@/components/calendar/calendar-grid"

const COLLECTION_NAME = "dockycalendar"

export class EventStorage {
  static async loadEvents(): Promise<CalendarEvent[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          start: data.start instanceof Timestamp ? data.start.toDate() : new Date(data.start),
          end: data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end),
          description: data.description,
          color: data.color,
          googleEventId: data.googleEventId,
        } as CalendarEvent
      })
    } catch (error) {
      console.error("Error loading events from Firebase:", error)
      return []
    }
  }

  static async addEvent(event: CalendarEvent): Promise<void> {
    try {
      const { id, ...eventData } = event
      // Store dates as Firestore Timestamps or ISO strings. 
      // Firestore handles Dates well, but explicit conversion can be safer if we want consistency.
      // We will save them as basic Dates which SDK converts to Timestamps.
      await setDoc(doc(db, COLLECTION_NAME, id), {
        ...eventData,
        start: event.start,
        end: event.end,
      })
    } catch (error) {
      console.error("Error adding event to Firebase:", error)
      throw error
    }
  }

  static async updateEvent(event: CalendarEvent): Promise<void> {
    try {
      const { id, ...eventData } = event
      await setDoc(doc(db, COLLECTION_NAME, id), {
        ...eventData,
        start: event.start,
        end: event.end,
      }, { merge: true })
    } catch (error) {
      console.error("Error updating event in Firebase:", error)
      throw error
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, eventId))
    } catch (error) {
      console.error("Error deleting event from Firebase:", error)
      throw error
    }
  }
}
