/**
 * Domain constants for the Incident Map platform.
 * Keep the type list in this file so it is easy to extend.
 */

export const INCIDENT_TYPES = [
  'murder',
  'kidnapping',
  'arrest_detention',
  'church_attack',
  'blasphemy_prosecution',
  'property_destruction',
  'displacement',
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  murder: 'Murder',
  kidnapping: 'Kidnapping',
  arrest_detention: 'Arrest / Detention',
  church_attack: 'Church Attack',
  blasphemy_prosecution: 'Blasphemy Prosecution',
  property_destruction: 'Property Destruction',
  displacement: 'Displacement',
};

/**
 * Perpetrator Categories.
 * HARD RULE: Never store names of individuals. Never use a religion as a perpetrator category.
 */
export const PERPETRATOR_CATEGORIES = [
  'state_authorities',
  'police',
  'mob',
  'armed_group',
  'family_or_community',
  'unknown',
] as const;

export type PerpetratorCategory = (typeof PERPETRATOR_CATEGORIES)[number];

export const PERPETRATOR_CATEGORY_LABELS: Record<PerpetratorCategory, string> = {
  state_authorities: 'State Authorities',
  police: 'Police',
  mob: 'Mob / Crowd',
  armed_group: 'Armed Group / Militia',
  family_or_community: 'Family or Community',
  unknown: 'Unknown',
};

/**
 * Legal Status categories.
 */
export const LEGAL_STATUSES = [
  'reported',
  'charged',
  'on_trial',
  'convicted',
  'acquitted',
  'dismissed',
  'unknown',
] as const;

export type LegalStatus = (typeof LEGAL_STATUSES)[number];

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  reported: 'Reported to Authorities',
  charged: 'Formal Charges Filed',
  on_trial: 'On Trial',
  convicted: 'Convicted',
  acquitted: 'Acquitted',
  dismissed: 'Dismissed',
  unknown: 'Unknown / Unrecorded',
};

/**
 * Verification Levels:
 * 1 = One source
 * 2 = Two independent sources
 * 3 = Court record or confirmation by a known organization
 */
export const VERIFICATION_LEVELS = [1, 2, 3] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export const VERIFICATION_LEVEL_DESCRIPTIONS: Record<VerificationLevel, string> = {
  1: 'Level 1: Single source report',
  2: 'Level 2: Verified by two independent sources',
  3: 'Level 3: Confirmed by court record or accredited organization',
};

/**
 * Incident Workflow Statuses
 */
export const INCIDENT_STATUSES = [
  'draft',
  'in_review',
  'published',
  'retracted',
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  published: 'Published',
  retracted: 'Retracted',
};

/**
 * Location Precision levels
 */
export const LOCATION_PRECISIONS = ['country', 'region', 'district'] as const;
export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

/**
 * Source Types
 */
export const SOURCE_TYPES = [
  'news_report',
  'ngo_report',
  'court_document',
  'official_statement',
  'academic_or_research',
  'other',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * Raw Lead Statuses
 */
export const RAW_ITEM_STATUSES = ['new', 'rejected', 'converted'] as const;
export type RawItemStatus = (typeof RAW_ITEM_STATUSES)[number];

/**
 * User Roles
 */
export const USER_ROLES = ['submitter', 'reviewer', 'publisher', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  submitter: 'Submitter',
  reviewer: 'Reviewer',
  publisher: 'Publisher',
  admin: 'Administrator',
};
