import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "sales"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "qualified",
  "converted",
  "closed",
]);
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
]);
export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "inactive",
  "suspended",
]);

// Lucia Auth Tables
export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

// Business Tables
export const inquiryTable = pgTable("inquiry", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message").notNull(),
  status: inquiryStatusEnum("status").notNull().default("new"),
  source: text("source").default("website"),
  assignedTo: text("assigned_to").references(() => userTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leadTable = pgTable("lead", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  wasteType: text("waste_type"),
  estimatedVolume: text("estimated_volume"),
  status: leadStatusEnum("status").notNull().default("new"),
  priority: integer("priority").default(3),
  estimatedValue: integer("estimated_value"),
  assignedTo: text("assigned_to").references(() => userTable.id),
  notes: text("notes"),
  nextFollowUp: timestamp("next_follow_up", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const potentialTable = pgTable("potential", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  industry: text("industry"),
  wasteType: text("waste_type"),
  estimatedVolume: text("estimated_volume"),
  source: text("source"),
  priority: integer("priority").default(3),
  assignedTo: text("assigned_to").references(() => userTable.id),
  notes: text("notes"),
  lastContact: timestamp("last_contact", { withTimezone: true }),
  nextFollowUp: timestamp("next_follow_up", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clientTable = pgTable("client", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  industry: text("industry"),
  wasteTypes: text("waste_types"),
  contractStartDate: timestamp("contract_start_date", { withTimezone: true }),
  contractEndDate: timestamp("contract_end_date", { withTimezone: true }),
  status: clientStatusEnum("status").notNull().default("active"),
  accountManager: text("account_manager").references(() => userTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Activity Log
export const activityLogTable = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
