import { db } from "../db/index.js";
import { calendarEventTable, userTable, clientTable } from "../db/schema.js";
import { eq, and, isNull, gte, lte, sql } from "drizzle-orm";
import emailService from "./emailService.js";

/**
 * Event Reminder Service
 * Handles scheduled email reminders for calendar events
 * Uses node-cron for scheduling
 */
class EventReminderService {
  /**
   * Send 24-hour reminders for events happening tomorrow
   * Runs daily at 8:00 AM via cron
   * Catches missed reminders from server restarts
   */
  async send24HourReminders() {
    try {
      const now = new Date();
      
      // Calculate time window: 23-25 hours from now (gives 2-hour grace period)
      const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      console.log(`🔔 Checking for 24-hour reminders...`);
      console.log(`   Window: ${startWindow.toISOString()} to ${endWindow.toISOString()}`);

      // Query events that need 24-hour reminders
      const events = await db
        .select({
          id: calendarEventTable.id,
          title: calendarEventTable.title,
          description: calendarEventTable.description,
          eventType: calendarEventTable.eventType,
          scheduledDate: calendarEventTable.scheduledDate,
          startTime: calendarEventTable.startTime,
          endTime: calendarEventTable.endTime,
          userId: calendarEventTable.userId,
          clientId: calendarEventTable.clientId,
          // User info
          userEmail: userTable.email,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          // Client info (if applicable)
          clientName: clientTable.contactPerson,
          companyName: clientTable.companyName,
        })
        .from(calendarEventTable)
        .leftJoin(userTable, eq(calendarEventTable.userId, userTable.id))
        .leftJoin(clientTable, eq(calendarEventTable.clientId, clientTable.id))
        .where(
          and(
            eq(calendarEventTable.status, "scheduled"),
            gte(calendarEventTable.scheduledDate, startWindow),
            lte(calendarEventTable.scheduledDate, endWindow),
            isNull(calendarEventTable.reminder24hSentAt)
          )
        );

      console.log(`   Found ${events.length} event(s) needing 24-hour reminders`);

      // Send reminders
      let sentCount = 0;
      for (const event of events) {
        if (!event.userEmail) {
          console.warn(`   ⚠️ No email for user ${event.userId}, skipping event ${event.id}`);
          continue;
        }

        // Calculate hours until event (for display)
        const hoursUntil = Math.round(
          (new Date(event.scheduledDate) - now) / (1000 * 60 * 60)
        );

        const emailData = {
          eventId: event.id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          scheduledDate: event.scheduledDate,
          startTime: event.startTime,
          endTime: event.endTime,
          userName: `${event.userFirstName} ${event.userLastName}`,
          clientName: event.clientName,
          companyName: event.companyName,
          hoursUntil,
        };

        // Send email (fire and forget)
        emailService
          .sendEventReminderEmail(event.userEmail, emailData, "24h")
          .catch((err) =>
            console.error(`   ❌ Failed to send 24h reminder for event ${event.id}:`, err.message)
          );

        // Mark as sent
        await db
          .update(calendarEventTable)
          .set({ reminder24hSentAt: now })
          .where(eq(calendarEventTable.id, event.id));

        sentCount++;
      }

      console.log(`   ✅ Sent ${sentCount} 24-hour reminder(s)`);
      return { success: true, sent: sentCount };
    } catch (error) {
      console.error("❌ Error in send24HourReminders:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send 1-hour reminders for events happening soon
   * Runs every 15 minutes via cron for better accuracy
   * Catches missed reminders from server restarts
   */
  async send1HourReminders() {
    try {
      const now = new Date();
      
      // Calculate time window: 55-70 minutes from now (optimized for 15-min checks)
      const startWindow = new Date(now.getTime() + 55 * 60 * 1000);
      const endWindow = new Date(now.getTime() + 70 * 60 * 1000);

      console.log(`🔔 Checking for 1-hour reminders...`);
      console.log(`   Window: ${startWindow.toISOString()} to ${endWindow.toISOString()}`);

      // Query events that need 1-hour reminders
      const events = await db
        .select({
          id: calendarEventTable.id,
          title: calendarEventTable.title,
          description: calendarEventTable.description,
          eventType: calendarEventTable.eventType,
          scheduledDate: calendarEventTable.scheduledDate,
          startTime: calendarEventTable.startTime,
          endTime: calendarEventTable.endTime,
          userId: calendarEventTable.userId,
          clientId: calendarEventTable.clientId,
          // User info
          userEmail: userTable.email,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          // Client info (if applicable)
          clientName: clientTable.contactPerson,
          companyName: clientTable.companyName,
        })
        .from(calendarEventTable)
        .leftJoin(userTable, eq(calendarEventTable.userId, userTable.id))
        .leftJoin(clientTable, eq(calendarEventTable.clientId, clientTable.id))
        .where(
          and(
            eq(calendarEventTable.status, "scheduled"),
            gte(calendarEventTable.scheduledDate, startWindow),
            lte(calendarEventTable.scheduledDate, endWindow),
            isNull(calendarEventTable.reminder1hSentAt)
          )
        );

      console.log(`   Found ${events.length} event(s) needing 1-hour reminders`);

      // Send reminders
      let sentCount = 0;
      for (const event of events) {
        if (!event.userEmail) {
          console.warn(`   ⚠️ No email for user ${event.userId}, skipping event ${event.id}`);
          continue;
        }

        // Calculate minutes until event (for display)
        const minutesUntil = Math.round(
          (new Date(event.scheduledDate) - now) / (1000 * 60)
        );

        const emailData = {
          eventId: event.id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          scheduledDate: event.scheduledDate,
          startTime: event.startTime,
          endTime: event.endTime,
          userName: `${event.userFirstName} ${event.userLastName}`,
          clientName: event.clientName,
          companyName: event.companyName,
          minutesUntil,
        };

        // Send email (fire and forget)
        emailService
          .sendEventReminderEmail(event.userEmail, emailData, "1h")
          .catch((err) =>
            console.error(`   ❌ Failed to send 1h reminder for event ${event.id}:`, err.message)
          );

        // Mark as sent
        await db
          .update(calendarEventTable)
          .set({ reminder1hSentAt: now })
          .where(eq(calendarEventTable.id, event.id));

        sentCount++;
      }

      console.log(`   ✅ Sent ${sentCount} 1-hour reminder(s)`);
      return { success: true, sent: sentCount };
    } catch (error) {
      console.error("❌ Error in send1HourReminders:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manual trigger for testing
   * Call this from a test route to verify reminders work
   */
  async testReminders() {
    console.log("🧪 Testing reminder system...");
    const results = await Promise.all([
      this.send24HourReminders(),
      this.send1HourReminders(),
    ]);
    return results;
  }
}

export default new EventReminderService();
