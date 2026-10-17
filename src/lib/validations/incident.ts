import { z } from 'zod';
import {
  INCIDENT_TYPES,
  PERPETRATOR_CATEGORIES,
  LEGAL_STATUSES,
  LOCATION_PRECISIONS,
  INCIDENT_STATUSES,
  SOURCE_TYPES,
  UserRole,
} from '@/lib/constants/incidents';

/**
 * Validation schema for individual sources.
 */
export const sourceSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url('Must be a valid URL'),
  publisher: z.string().min(1, 'Publisher is required').max(200),
  language: z.string().min(2).max(10).default('en'),
  sourceType: z.enum(SOURCE_TYPES),
});

export type SourceInput = z.infer<typeof sourceSchema>;

/**
 * Incident input schema.
 * Note: Under HARD RULES, NO fields exist for victim names or exact addresses.
 */
export const incidentSchema = z
  .object({
    id: z.string().uuid().optional(),
    country: z.string().min(2, 'Country is required').max(100),
    region: z.string().max(150).nullable().optional(),
    district: z.string().max(150).nullable().optional(),
    locationPrecision: z.enum(LOCATION_PRECISIONS),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    incidentDate: z.coerce.date(),
    reportedDate: z.coerce.date().optional(),
    type: z.enum(INCIDENT_TYPES),
    victimCountMin: z.number().int().min(0).default(1),
    victimCountMax: z.number().int().min(0).nullable().optional(),
    perpetratorCategory: z.enum(PERPETRATOR_CATEGORIES),
    neutralSummary: z
      .string()
      .min(10, 'Summary must be at least 10 characters')
      .max(5000),
    legalStatus: z.enum(LEGAL_STATUSES).default('unknown'),
    verificationLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
    disputedFlag: z.boolean().default(false),
    status: z.enum(INCIDENT_STATUSES).default('draft'),
    sources: z.array(sourceSchema).default([]),
  })
  .refine(
    (data) => {
      if (data.victimCountMax != null) {
        return data.victimCountMax >= data.victimCountMin;
      }
      return true;
    },
    {
      message: 'Maximum victim count cannot be less than minimum victim count',
      path: ['victimCountMax'],
    }
  );

export type IncidentInput = z.infer<typeof incidentSchema>;

/**
 * Schema for logging changes to an incident.
 */
export const incidentChangeSchema = z.object({
  incidentId: z.string().uuid(),
  whatChanged: z.record(z.string(), z.unknown()),
  reason: z.string().min(5, 'Reason for modification is required (min 5 chars)'),
  publicFlag: z.boolean().default(true),
});

export type IncidentChangeInput = z.infer<typeof incidentChangeSchema>;

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * HARD RULES CHECK FOR PUBLISHING:
 * 1. Only users with the publisher role can publish.
 * 2. An incident cannot be published unless it has at least 2 sources.
 * 3. An incident cannot be published unless verification level is 2 or higher.
 */
export interface PublishEligibilityParams {
  userRole: UserRole | string | undefined | null;
  verificationLevel: number;
  sourceCount: number;
}

export function validatePublishEligibility({
  userRole,
  verificationLevel,
  sourceCount,
}: PublishEligibilityParams): { allowed: boolean; errors: string[] } {
  const errors: string[] = [];

  // Rule 1: Role check (server enforced)
  if (userRole !== 'publisher') {
    errors.push('Only users with the "publisher" role are authorized to publish incidents.');
  }

  // Rule 2: Minimum sources
  if (sourceCount < 2) {
    errors.push(
      `An incident cannot be published with fewer than 2 sources (currently has ${sourceCount}).`
    );
  }

  // Rule 3: Verification level >= 2
  if (verificationLevel < 2) {
    errors.push(
      `An incident cannot be published with verification level ${verificationLevel}. Level 2 or higher is required.`
    );
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}
