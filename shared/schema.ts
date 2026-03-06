import { pgTable, text, serial, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pilgrims = pgTable("pilgrims", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nationality: text("nationality").notNull(),
  passportNumber: text("passport_number").notNull().unique(),
  phone: text("phone").notNull(),
  campaignGroup: text("campaign_group"),
  permitStatus: text("permit_status").notNull(), // 'Valid', 'Expired', 'None'
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  emergencyStatus: boolean("emergency_status").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const emergencies = pgTable("emergencies", {
  id: serial("id").primaryKey(),
  pilgrimId: serial("pilgrim_id").references(() => pilgrims.id),
  type: text("type").notNull(), // 'Medical', 'Lost', 'Security'
  status: text("status").notNull().default("Active"), // 'Active', 'Resolved'
  locationLat: doublePrecision("location_lat").notNull(),
  locationLng: doublePrecision("location_lng").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'Unauthorized', 'Crowd Density', 'Weather'
  message: text("message").notNull(),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  status: text("status").notNull().default("Active"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertPilgrimSchema = createInsertSchema(pilgrims).omit({ id: true, lastUpdated: true });
export const insertEmergencySchema = createInsertSchema(emergencies).omit({ id: true, timestamp: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, timestamp: true });

// Types
export type Pilgrim = typeof pilgrims.$inferSelect;
export type InsertPilgrim = z.infer<typeof insertPilgrimSchema>;

export type Emergency = typeof emergencies.$inferSelect;
export type InsertEmergency = z.infer<typeof insertEmergencySchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
