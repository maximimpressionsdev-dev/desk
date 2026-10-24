import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"])

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
])

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
])

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 320 }),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("USER"),
    active: boolean("active").notNull().default(true),
    externalId: integer("external_id"),
    employeeNumber: varchar("employee_number", { length: 32 }),
    username: varchar("username", { length: 80 }),
    nic: varchar("nic", { length: 32 }),
    phone: varchar("phone", { length: 20 }),
    /** The ERP Employee record (e.g. HR-EMP-00012), set by the ERP directory sync */
    erpEmployee: varchar("erp_employee", { length: 40 }),
    /** Their ERP login (an email), when they have one: they can sign in with the ERP password */
    erpUser: varchar("erp_user", { length: 140 }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_uidx").on(t.email),
    uniqueIndex("users_external_id_uidx").on(t.externalId),
    uniqueIndex("users_employee_number_uidx").on(t.employeeNumber),
    index("users_username_idx").on(t.username),
    index("users_erp_employee_idx").on(t.erpEmployee),
    index("users_erp_user_idx").on(t.erpUser),
  ]
)

// One-time sign-in codes sent by SMS; only a hash is stored and each code works once
export const loginCodes = pgTable(
  "login_codes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_codes_user_created_idx").on(t.userId, t.createdAt)]
)

export const invites = pgTable(
  "invites",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 200 }),
    tokenHash: text("token_hash").notNull(),
    invitedById: integer("invited_by_id")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invites_email_idx").on(t.email)]
)

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const departments = pgTable(
  "departments",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    active: boolean("active").notNull().default(true),
    notifyEmail: varchar("notify_email", { length: 320 }),
    /** The ERP Department record (e.g. "Accounts - MIL"), set by the ERP directory sync */
    erpName: varchar("erp_name", { length: 140 }),
    externalId: integer("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("departments_code_uidx").on(t.code),
    uniqueIndex("departments_external_id_uidx").on(t.externalId),
  ]
)

export const departmentMembers = pgTable(
  "department_members",
  {
    id: serial("id").primaryKey(),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("department_members_uidx").on(t.departmentId, t.userId),
    index("department_members_user_idx").on(t.userId),
  ]
)

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: serial("id").primaryKey(),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_types_dept_idx").on(t.departmentId)]
)

export const issueCategories = pgTable(
  "issue_categories",
  {
    id: serial("id").primaryKey(),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "cascade",
    }),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameSi: varchar("name_si", { length: 200 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("issue_categories_dept_idx").on(t.departmentId)]
)

export const issueReasons = pgTable(
  "issue_reasons",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => issueCategories.id, { onDelete: "cascade" }),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameSi: varchar("name_si", { length: 200 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("issue_reasons_category_idx").on(t.categoryId)]
)

// FactoryOS applications a ticket can be about, copied from the ERP (Maxim App) by syncApplications()
export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    /** The Maxim App record name in the ERP, e.g. "Employee Gatepass" */
    name: varchar("name", { length: 120 }).notNull(),
    /** Its path under FactoryOS, e.g. "/employee-pass" */
    link: varchar("link", { length: 300 }),
    icon: varchar("icon", { length: 60 }),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Gone from the ERP or disabled there: kept for old tickets, hidden from new ones */
    active: boolean("active").notNull().default(true),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("applications_name_uidx").on(t.name)]
)

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description").notNull().default(""),
    priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
    status: ticketStatusEnum("status").notNull().default("OPEN"),
    holdReason: text("hold_reason"),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id),
    ticketTypeId: integer("ticket_type_id").references(() => ticketTypes.id),
    issueCategoryId: integer("issue_category_id").references(() => issueCategories.id),
    issueReasonId: integer("issue_reason_id").references(() => issueReasons.id),
    applicationId: integer("application_id").references(() => applications.id),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id),
    assigneeId: integer("assignee_id").references(() => users.id),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("tickets_code_uidx").on(t.code),
    index("tickets_dept_status_updated_idx").on(t.departmentId, t.status, t.updatedAt),
    index("tickets_assignee_status_idx").on(t.assigneeId, t.status),
    index("tickets_requester_created_idx").on(t.requesterId, t.createdAt),
    index("tickets_issue_reason_idx").on(t.issueReasonId),
  ]
)

export const ticketComments = pgTable(
  "ticket_comments",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    isProgress: boolean("is_progress").notNull().default(false),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_comments_ticket_idx").on(t.ticketId)]
)

export const ticketEvents = pgTable(
  "ticket_events",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    actorId: integer("actor_id").references(() => users.id),
    type: varchar("type", { length: 64 }).notNull(),
    message: text("message").notNull(),
    meta: text("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_events_ticket_idx").on(t.ticketId)]
)

export const attachments = pgTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    uploadedById: integer("uploaded_by_id")
      .notNull()
      .references(() => users.id),
    storageKey: text("storage_key").notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    size: integer("size").notNull(),
    mime: varchar("mime", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attachments_ticket_idx").on(t.ticketId)]
)

export const ticketWatchers = pgTable(
  "ticket_watchers",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ticket_watchers_uidx").on(t.ticketId, t.userId),
    index("ticket_watchers_user_idx").on(t.userId),
  ]
)

export const cannedReplies = pgTable(
  "canned_replies",
  {
    id: serial("id").primaryKey(),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    body: text("body").notNull(),
    createdById: integer("created_by_id")
      .notNull()
      .references(() => users.id),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("canned_replies_dept_idx").on(t.departmentId)]
)

export const ticketLinkTypeEnum = pgEnum("ticket_link_type", ["related", "blocks", "blocked_by"])

export const ticketLinks = pgTable(
  "ticket_links",
  {
    id: serial("id").primaryKey(),
    fromTicketId: integer("from_ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    toTicketId: integer("to_ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    type: ticketLinkTypeEnum("type").notNull().default("related"),
    createdById: integer("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ticket_links_uidx").on(t.fromTicketId, t.toTicketId, t.type),
    index("ticket_links_to_idx").on(t.toTicketId),
  ]
)

export type User = typeof users.$inferSelect
export type Department = typeof departments.$inferSelect
export type Ticket = typeof tickets.$inferSelect
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number]
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number]
export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type IssueCategory = typeof issueCategories.$inferSelect
export type IssueReason = typeof issueReasons.$inferSelect

export const healthLogs = pgTable("health_logs", {
  id: serial("id").primaryKey(),
  note: varchar("note", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
