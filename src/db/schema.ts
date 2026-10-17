import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  index,
  jsonb,
  geometry,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  INCIDENT_TYPES,
  PERPETRATOR_CATEGORIES,
  LEGAL_STATUSES,
  LOCATION_PRECISIONS,
  INCIDENT_STATUSES,
  USER_ROLES,
  RAW_ITEM_STATUSES,
  SOURCE_TYPES,
} from '@/lib/constants/incidents';

/**
 * Users Table
 * Reviewers, submitters, publishers, admins.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: USER_ROLES }).notNull().default('reviewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Raw Items Table (Collected leads, never public)
 */
export const rawItems = pgTable(
  'raw_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceName: text('source_name').notNull(),
    url: text('url').notNull(),
    title: text('title').notNull(),
    rawText: text('raw_text').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    hash: text('hash').notNull().unique(),
    status: text('status', { enum: RAW_ITEM_STATUSES }).notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('raw_items_status_idx').on(table.status),
    index('raw_items_hash_idx').on(table.hash),
  ]
);

/**
 * Incidents Table
 * HARD RULES:
 * - NO victim names or exact addresses. Add no field for them.
 * - Lat and Lng are approximate only.
 */
export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    country: text('country').notNull(),
    region: text('region'),
    district: text('district'),
    locationPrecision: text('location_precision', { enum: LOCATION_PRECISIONS }).notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    // PostGIS Point geometry for spatial indexing and proximity queries
    geom: geometry('geom', { type: 'point', mode: 'xy', srid: 4326 }),
    incidentDate: timestamp('incident_date', { withTimezone: true }).notNull(),
    reportedDate: timestamp('reported_date', { withTimezone: true }).defaultNow().notNull(),
    type: text('type', { enum: INCIDENT_TYPES }).notNull(),
    // Victim count stored as a range (min/max)
    victimCountMin: integer('victim_count_min').notNull().default(1),
    victimCountMax: integer('victim_count_max'),
    perpetratorCategory: text('perpetrator_category', { enum: PERPETRATOR_CATEGORIES }).notNull(),
    neutralSummary: text('neutral_summary').notNull(),
    legalStatus: text('legal_status', { enum: LEGAL_STATUSES }).notNull().default('unknown'),
    // Verification Level: 1 = 1 source, 2 = 2 independent sources, 3 = court record / org confirmation
    verificationLevel: integer('verification_level').notNull().default(1),
    disputedFlag: boolean('disputed_flag').notNull().default(false),
    status: text('status', { enum: INCIDENT_STATUSES }).notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('incidents_status_idx').on(table.status),
    index('incidents_country_idx').on(table.country),
    index('incidents_type_idx').on(table.type),
    index('incidents_verification_idx').on(table.verificationLevel),
    index('incidents_date_idx').on(table.incidentDate),
    index('incidents_geom_idx').using('gist', table.geom),
  ]
);

/**
 * Sources Table
 * Linked to verified incidents.
 */
export const sources = pgTable(
  'sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    publisher: text('publisher').notNull(),
    language: text('language').notNull().default('en'),
    sourceType: text('source_type', { enum: SOURCE_TYPES }).notNull().default('news_report'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('sources_incident_idx').on(table.incidentId),
  ]
);

/**
 * Incident Changes Table
 * Change log / corrections for incidents. Publicly viewable for published incidents.
 */
export const incidentChanges = pgTable(
  'incident_changes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    whatChanged: jsonb('what_changed').notNull(),
    reason: text('reason').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    publicFlag: boolean('public_flag').notNull().default(true),
  },
  (table) => [
    index('incident_changes_incident_idx').on(table.incidentId),
    index('incident_changes_public_idx').on(table.publicFlag),
  ]
);

// Relations
export const incidentsRelations = relations(incidents, ({ many }) => ({
  sources: many(sources),
  changes: many(incidentChanges),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  incident: one(incidents, {
    fields: [sources.incidentId],
    references: [incidents.id],
  }),
}));

export const incidentChangesRelations = relations(incidentChanges, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentChanges.incidentId],
    references: [incidents.id],
  }),
  user: one(users, {
    fields: [incidentChanges.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  changes: many(incidentChanges),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type RawItem = typeof rawItems.$inferSelect;
export type NewRawItem = typeof rawItems.$inferInsert;
export type IncidentChange = typeof incidentChanges.$inferSelect;
export type NewIncidentChange = typeof incidentChanges.$inferInsert;
