import { auth } from '@/auth';
import { UserRole } from '@/lib/constants/incidents';
import { validatePublishEligibility } from '@/lib/validations/incident';
import { db, incidents, sources } from '@/db';
import { eq, count } from 'drizzle-orm';

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized: Insufficient privileges') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Unauthenticated: Please sign in') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Retrieve the current session user.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Ensure user is authenticated. Throws AuthenticationError if not logged in.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new AuthenticationError();
  }
  return user;
}

/**
 * Require the user to have one of the permitted roles.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Access denied. Role "${user.role}" is not authorized for this action. Required: ${allowedRoles.join(', ')}`
    );
  }
  return user;
}

/**
 * Specifically require the 'publisher' role.
 * HARD RULE: Only users with the publisher role can publish.
 */
export async function requirePublisher() {
  return requireRole(['publisher']);
}

/**
 * Specifically require the 'admin' role.
 */
export async function requireAdmin() {
  return requireRole(['admin']);
}

/**
 * Specifically require at least 'reviewer', 'publisher', or 'admin'.
 */
export async function requireReviewerOrAbove() {
  return requireRole(['reviewer', 'publisher', 'admin']);
}

/**
 * Server-side check before publishing any incident.
 * Enforces:
 * 1. User has the 'publisher' role
 * 2. Incident has at least 2 sources
 * 3. Incident verification level is >= 2
 */
export async function verifyAndAssertPublishEligibility(incidentId: string) {
  const user = await requirePublisher();

  // Fetch incident verification level
  const [incident] = await db
    .select({
      id: incidents.id,
      verificationLevel: incidents.verificationLevel,
      status: incidents.status,
    })
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Count attached sources
  const [sourceResult] = await db
    .select({ total: count() })
    .from(sources)
    .where(eq(sources.incidentId, incidentId));

  const sourceCount = Number(sourceResult?.total ?? 0);

  const eligibility = validatePublishEligibility({
    userRole: user.role,
    verificationLevel: incident.verificationLevel,
    sourceCount,
  });

  if (!eligibility.allowed) {
    throw new AuthorizationError(
      `Cannot publish incident: ${eligibility.errors.join(' ')}`
    );
  }

  return { incident, user, sourceCount };
}
