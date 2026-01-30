import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  pgEnum,
  index,
  unique,
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
  "pending",      // Sales created, waiting for admin review
  "approved",     // Admin approved, waiting for sales to send
  "disapproved",  // Admin disapproved, sales can revise
  "sent",         // Sales sent to client, waiting for client response
  "accepted",     // Client accepted the proposal
  "rejected",     // Client rejected the proposal
  "cancelled",    // Cancelled by sales or admin
]);

// Contract status - tracks contract request workflow
export const contractStatusEnum = pgEnum("contract_status", [
  "pending_request",   // Auto-created, waiting for Sales to request
  "requested",         // Sales requested contract from Admin
  "ready_for_sales",   // Admin uploaded contract, not sent to Sales yet
  "sent_to_sales",     // Admin sent to Sales, waiting for Sales to send to client
  "sent_to_client",    // Sales sent to client (final status)
]);

// Contract type enum
export const contractTypeEnum = pgEnum("contract_type", [
  "long_term_variable",  // LONG TERM GARBAGE VARIABLE CHARGE
  "long_term_fixed",     // LONG TERM GARBAGE FIXED CHARGE (MORE THAN 50,000 PHP / MONTH)
  "fixed_rate_term",     // FIXED RATE TERM
  "garbage_bins",        // GARBAGE BINS
  "garbage_bins_disposal", // GARBAGE BINS WITH DISPOSAL
]);

// Schedule of garbage collection enum
export const collectionScheduleEnum = pgEnum("collection_schedule", [
  "daily",
  "weekly",
  "monthly",
  "bi_weekly",
  "other",
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
  inquiryNumber: text("inquiry_number").notNull().unique(), // Format: INQ-YYYYMMDD-NNNN
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  location: text("location"),
  message: text("message").notNull(),
  serviceId: uuid("service_id").references(() => serviceTable.id),
  status: inquiryStatusEnum("status").notNull().default("initial_comms"),
  source: text("source").default("website"),
  assignedTo: text("assigned_to").references(() => userTable.id),
  notes: text("notes"),
  isInformationComplete: boolean("is_information_complete").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  inquiryNumberIdx: index("inquiry_number_idx").on(table.inquiryNumber),
}));

export const inquiryNotesTable = pgTable("inquiry_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  inquiryId: uuid("inquiry_id")
    .notNull()
    .references(() => inquiryTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  inquiryIdIdx: index("inquiry_notes_inquiry_id_idx").on(table.inquiryId),
  createdAtIdx: index("inquiry_notes_created_at_idx").on(table.createdAt),
}));

// Calendar Events Table
export const calendarEventTable = pgTable("calendar_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  inquiryId: uuid("inquiry_id").references(() => inquiryTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type"), // site_visit, call, meeting, follow_up, etc. (fully customizable)
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  startTime: text("start_time"), // HH:MM format (optional)
  endTime: text("end_time"), // HH:MM format (optional)
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userIdIdx: index("calendar_event_user_id_idx").on(table.userId),
  scheduledDateIdx: index("calendar_event_scheduled_date_idx").on(table.scheduledDate),
  inquiryIdIdx: index("calendar_event_inquiry_id_idx").on(table.inquiryId),
}));

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
  defaultTemplateId: uuid("default_template_id").references(() => proposalTemplateTable.id),
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
  proposalNumber: text("proposal_number").notNull().unique(), // Format: PROP-YYYYMMDD-NNNN

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

  // Client Response (from email buttons)
  clientResponse: text("client_response"), // "approved", "rejected", null
  clientResponseAt: timestamp("client_response_at", { withTimezone: true }),
  clientResponseToken: text("client_response_token"), // Secure token for email links
  clientResponseIp: text("client_response_ip"),

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
  proposalNumberIdx: index("proposal_number_idx").on(table.proposalNumber),
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

// Contracts - Contract requests from approved proposals
export const contractsTable = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to original proposal (one-to-one relationship)
  proposalId: uuid("proposal_id")
    .notNull()
    .unique()
    .references(() => proposalTable.id, { onDelete: "cascade" }),

  // Contract Status
  status: contractStatusEnum("status")
    .notNull()
    .default("pending_request"),

  // Sales Request
  requestedBy: text("requested_by")
    .references(() => userTable.id), // Sales user who requested
  requestedAt: timestamp("requested_at", { withTimezone: true }),
  requestNotes: text("request_notes"), // Sales notes when requesting

  // Contract Details (filled by Sales when requesting)
  contractType: contractTypeEnum("contract_type"), // Type of contract
  clientName: text("client_name"), // Contact person name
  companyName: text("company_name"), // Full corporate name (optional)
  clientEmailContract: text("client_email_contract"), // Client email for contract form
  clientAddress: text("client_address"), // Client address
  contractDuration: text("contract_duration"), // Effectivity of contract duration
  serviceLatitude: text("service_latitude"), // Service location latitude
  serviceLongitude: text("service_longitude"), // Service location longitude
  collectionSchedule: collectionScheduleEnum("collection_schedule"),
  collectionScheduleOther: text("collection_schedule_other"), // If "other" is selected
  wasteAllowance: text("waste_allowance"), // Allocated amount for fixed clients
  specialClauses: text("special_clauses"), // Special clauses or requests
  signatories: text("signatories"), // JSON array of signatories with positions
  ratePerKg: text("rate_per_kg"), // Rate specifications (e.g., "PHP 3.50/kg food - VAT ex.")
  clientRequests: text("client_requests"), // Client requests for modifications
  customTemplateUrl: text("custom_template_url"), // Path to client's custom contract template (if provided)

  // Admin Contract Upload
  contractUploadedBy: text("contract_uploaded_by")
    .references(() => userTable.id), // Admin who uploaded
  contractUploadedAt: timestamp("contract_uploaded_at", { withTimezone: true }),
  contractPdfUrl: text("contract_pdf_url"), // Path to uploaded PDF
  adminNotes: text("admin_notes"), // Admin notes for Sales

  // Send to Sales
  sentToSalesBy: text("sent_to_sales_by")
    .references(() => userTable.id), // Admin who sent to Sales
  sentToSalesAt: timestamp("sent_to_sales_at", { withTimezone: true }),

  // Send to Client
  sentToClientBy: text("sent_to_client_by")
    .references(() => userTable.id), // Sales who sent to client
  sentToClientAt: timestamp("sent_to_client_at", { withTimezone: true }),
  clientEmail: text("client_email"), // Email address used to send (keep existing field)

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  proposalIdIdx: index("contracts_proposal_id_idx").on(table.proposalId),
  statusIdx: index("contracts_status_idx").on(table.status),
  requestedByIdx: index("contracts_requested_by_idx").on(table.requestedBy),
}));

// Showcase Table
export const showcaseTable = pgTable("showcase", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  tagline: text("tagline"),
  description: text("description").notNull(),
  image: text("image"),
  link: text("link"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  displayOrderIdx: index("showcase_display_order_idx").on(table.displayOrder),
  isActiveIdx: index("showcase_is_active_idx").on(table.isActive),
}));

// Clients Showcase Table
export const clientsShowcaseTable = pgTable("clients_showcase", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  logo: text("logo"),
  industry: text("industry").notNull(),
  location: text("location"),
  employees: text("employees"),
  established: text("established"),
  background: text("background").notNull(),
  challenge: text("challenge"),
  solution: text("solution"),
  testimonial: text("testimonial").notNull(),
  author: text("author").notNull(),
  position: text("position"),
  rating: integer("rating").default(5),
  wasteReduction: text("waste_reduction"),
  partnership: text("partnership"),
  achievements: text("achievements").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  isActiveIdx: index("clients_showcase_is_active_idx").on(table.isActive),
  companyIdx: index("clients_showcase_company_idx").on(table.company),
}));

// Blog Post Status Enum
export const blogPostStatusEnum = pgEnum("blog_post_status", [
  "draft",
  "published",
  "archived",
]);

// Blog Posts
export const blogPostTable = pgTable("blog_post", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  category: text("category").notNull(),
  tags: text("tags").array(),
  status: blogPostStatusEnum("status").notNull().default("draft"),
  author: text("author").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  views: integer("views").default(0),
  readTime: text("read_time"),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  slugIdx: index("blog_post_slug_idx").on(table.slug),
  statusIdx: index("blog_post_status_idx").on(table.status),
  categoryIdx: index("blog_post_category_idx").on(table.category),
  publishedAtIdx: index("blog_post_published_at_idx").on(table.publishedAt),
}));

// Counters Table - For generating sequential numbers (INQ-YYYYMMDD-NNNN, PROP-YYYYMMDD-NNNN)
export const countersTable = pgTable("counters", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // 'inquiry', 'proposal'
  date: text("date").notNull(), // 'YYYY-MM-DD' format
  currentValue: integer("current_value").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  uniqueEntityDate: unique("counters_entity_date_unique").on(table.entityType, table.date),
  entityTypeIdx: index("counters_entity_type_idx").on(table.entityType),
  dateIdx: index("counters_date_idx").on(table.date),
}));

// Activity Log
export const activityLogTable = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  inquiryId: uuid("inquiry_id").references(() => inquiryTable.id, {
    onDelete: "cascade",
  }),
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
