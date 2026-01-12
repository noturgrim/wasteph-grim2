import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "sales"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "submitted_proposal",
  "initial_comms",
  "negotiating",
  "to_call",
  "submitted_company_profile",
  "na",
  "waiting_for_feedback",
  "declined",
  "on_boarded",
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
// Removed serviceTypeEnum - now using service table instead
export const serviceModeEnum = pgEnum("service_mode", [
  "one_time",
  "contract_based",
]);
export const collectionFrequencyEnum = pgEnum("collection_frequency", [
  "daily",
  "three_times_week",
  "weekly",
  "custom",
]);
export const propertyTypeEnum = pgEnum("property_type", [
  "residential",
  "commercial",
]);
export const priorityLevelEnum = pgEnum("priority_level", [
  "low",
  "medium",
  "high",
]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "pending",    // Sales created, waiting for admin review
  "approved",   // Admin approved, waiting for sales to send
  "rejected",   // Admin rejected, sales can revise
  "sent",       // Sales sent to client
  "cancelled",  // Cancelled by sales or admin
]);

// Proposal Template Types
export const proposalTemplateTypeEnum = pgEnum("proposal_template_type", [
  "compactor_hauling",
  "hazardous_waste",
  "fixed_monthly",
  "clearing_project",
  "one_time_hauling",
  "long_term",
  "recyclables_purchase"
]);

// Lucia Auth Tables
export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("sales"),
  isMasterSales: boolean("is_master_sales").notNull().default(false),
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
  serviceId: uuid("service_id").references(() => serviceTable.id),
  serviceType: text("service_type"), // Maps to template types for auto-suggestion
  status: inquiryStatusEnum("status").notNull().default("initial_comms"),
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
  clientName: text("client_name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  notes: text("notes"),
  isClaimed: boolean("is_claimed").notNull().default(false),
  claimedBy: text("claimed_by").references(() => userTable.id),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
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

// Service Requests
export const serviceRequestTable = pgTable("service_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadTable.id, { onDelete: "cascade" }),

  // Common fields for all service types
  serviceId: uuid("service_id").notNull().references(() => serviceTable.id),
  serviceMode: serviceModeEnum("service_mode").notNull(),
  serviceLocation: text("service_location").notNull(),
  city: text("city"),
  estimatedVolume: text("estimated_volume"),
  notes: text("notes"),
  priority: priorityLevelEnum("priority").default("medium"),
  attachments: text("attachments"), // JSON array of file URLs

  // Garbage Collection specific fields
  collectionFrequency: collectionFrequencyEnum("collection_frequency"),
  wasteType: text("waste_type"), // general / mixed / food
  containerInfo: text("container_info"),
  garbagePhoto: text("garbage_photo"),
  pricingModel: text("pricing_model"), // fixed / variable

  // Septic Siphoning specific fields
  propertyType: propertyTypeEnum("property_type"),
  lastSiphoningDate: timestamp("last_siphoning_date", { withTimezone: true }),
  estimatedTankSize: text("estimated_tank_size"),
  accessNotes: text("access_notes"),
  urgencyTargetDate: timestamp("urgency_target_date", { withTimezone: true }),

  // Hazardous Waste specific fields
  hazardousCategory: text("hazardous_category"),
  packagingCondition: text("packaging_condition"), // sealed drums / loose
  hazardousQuantity: text("hazardous_quantity"),
  storageCondition: text("storage_condition"),
  complianceNotes: text("compliance_notes"),

  // One-time Hauling specific fields
  materialType: text("material_type"), // construction debris, junk, etc.
  loadSize: text("load_size"),
  preferredPickupDate: timestamp("preferred_pickup_date", { withTimezone: true }),
  loadingConstraints: text("loading_constraints"),
  haulingPhoto: text("hauling_photo"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Reference Data Tables
export const serviceTable = pgTable("service", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wasteTypeTable = pgTable("waste_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const provinceTable = pgTable("province", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  region: text("region"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Proposal Templates
export const proposalTemplateTable = pgTable("proposal_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  htmlTemplate: text("html_template").notNull(),
  templateType: proposalTemplateTypeEnum("template_type"),
  category: text("category"), // "waste_collection", "hazardous", "recyclables"
  templateConfig: text("template_config"), // JSON: {hasWasteAllowance, hasEquipment, etc.}
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  nameIdx: index("proposal_template_name_idx").on(table.name),
  isDefaultIdx: index("proposal_template_is_default_idx").on(table.isDefault),
  templateTypeIdx: index("proposal_template_type_idx").on(table.templateType),
}));

// Proposals
export const proposalTable = pgTable("proposal", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Relationships
  inquiryId: uuid("inquiry_id")
    .notNull()
    .references(() => inquiryTable.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => proposalTemplateTable.id),
  requestedBy: text("requested_by")
    .notNull()
    .references(() => userTable.id),
  reviewedBy: text("reviewed_by").references(() => userTable.id),

  // Proposal Data (JSON - services, pricing, terms)
  proposalData: text("proposal_data").notNull(),

  // Workflow Status
  status: proposalStatusEnum("status").notNull().default("pending"),
  wasTemplateSuggested: boolean("was_template_suggested").default(false),

  // Review Details
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),

  // Email Tracking
  sentBy: text("sent_by").references(() => userTable.id), // Sales user who sent to client
  sentAt: timestamp("sent_at", { withTimezone: true }), // When sent to client
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  emailStatus: text("email_status"), // "sent", "failed"

  // PDF Storage
  pdfUrl: text("pdf_url"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  inquiryIdIdx: index("proposal_inquiry_id_idx").on(table.inquiryId),
  templateIdIdx: index("proposal_template_id_idx").on(table.templateId),
  statusIdx: index("proposal_status_idx").on(table.status),
  requestedByIdx: index("proposal_requested_by_idx").on(table.requestedBy),
  reviewedByIdx: index("proposal_reviewed_by_idx").on(table.reviewedBy),
  statusRequestedByIdx: index("proposal_status_requested_by_idx").on(
    table.status,
    table.requestedBy
  ),
}));

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
