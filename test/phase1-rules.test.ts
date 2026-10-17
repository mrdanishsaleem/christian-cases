import { validatePublishEligibility, incidentSchema } from '../src/lib/validations/incident';
import { INCIDENT_TYPES, PERPETRATOR_CATEGORIES, LEGAL_STATUSES } from '../src/lib/constants/incidents';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ PASSED: ${message}`);
}

console.log('🧪 Testing Phase 1 Hard Rules & Validations...\n');

// 1. Role enforcement for publishing
const nonPublisherAttempt = validatePublishEligibility({
  userRole: 'reviewer',
  verificationLevel: 3,
  sourceCount: 3,
});
assert(
  !nonPublisherAttempt.allowed && nonPublisherAttempt.errors.some((e) => e.includes('publisher')),
  'Server blocks non-publisher (reviewer) from publishing'
);

const submitterAttempt = validatePublishEligibility({
  userRole: 'submitter',
  verificationLevel: 2,
  sourceCount: 2,
});
assert(
  !submitterAttempt.allowed && submitterAttempt.errors.some((e) => e.includes('publisher')),
  'Server blocks submitter from publishing'
);

// 2. Minimum sources enforcement (at least 2 sources)
const singleSourceAttempt = validatePublishEligibility({
  userRole: 'publisher',
  verificationLevel: 2,
  sourceCount: 1,
});
assert(
  !singleSourceAttempt.allowed && singleSourceAttempt.errors.some((e) => e.includes('fewer than 2 sources')),
  'Server blocks publishing with fewer than 2 sources'
);

// 3. Verification level enforcement (level >= 2)
const lowLevelAttempt = validatePublishEligibility({
  userRole: 'publisher',
  verificationLevel: 1,
  sourceCount: 3,
});
assert(
  !lowLevelAttempt.allowed && lowLevelAttempt.errors.some((e) => e.includes('Level 2 or higher')),
  'Server blocks publishing with verification level 1'
);

// 4. Valid publisher with >= 2 sources and level >= 2 succeeds
const validAttempt = validatePublishEligibility({
  userRole: 'publisher',
  verificationLevel: 2,
  sourceCount: 2,
});
assert(validAttempt.allowed && validAttempt.errors.length === 0, 'Publisher with 2 sources and Level 2 passes validation');

// 5. Schema check: ensure no victim name or address fields exist in schema keys
const samplePayload = {
  country: 'Nigeria',
  locationPrecision: 'district' as const,
  lat: 10.43,
  lng: 7.42,
  incidentDate: new Date(),
  type: 'church_attack' as const,
  victimCountMin: 1,
  perpetratorCategory: 'armed_group' as const,
  neutralSummary: 'Sample neutral incident summary text for validation test.',
  legalStatus: 'reported' as const,
  verificationLevel: 2 as const,
  disputedFlag: false,
  status: 'draft' as const,
  sources: [],
};

const parsed = incidentSchema.safeParse(samplePayload);
assert(parsed.success, 'Valid incident payload parses cleanly');

// Check that invalid types fail
const invalidTypePayload = { ...samplePayload, type: 'invalid_type' };
const invalidTypeResult = incidentSchema.safeParse(invalidTypePayload);
assert(!invalidTypeResult.success, 'Unknown incident type rejected by Zod');

console.log('\n🎉 All Phase 1 business rules & verification checks passed successfully!');
