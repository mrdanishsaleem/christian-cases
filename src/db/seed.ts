import { hash } from 'bcryptjs';
import { db, users, incidents, sources, incidentChanges } from './index';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  console.log('🌱 Starting database seeding for incident-map...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env');
    process.exit(1);
  }

  // Ensure PostGIS extension is enabled
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log('✓ PostGIS extension verified.');
  } catch (err) {
    console.warn('⚠️ Warning: Could not verify PostGIS extension. Ensure PostGIS is enabled on your Postgres instance.', err);
  }

  console.log('🧹 Cleaning existing test data...');
  try {
    await db.delete(incidentChanges);
    await db.delete(sources);
    await db.delete(incidents);
    await db.delete(users);
  } catch (e) {
    console.log('Note: Clean table pass completed or tables were empty.', e);
  }

  // 1. Seed Users with distinct roles
  console.log('👤 Seeding accounts with roles...');
  const defaultPassword = await hash('Password123!', 10);

  const [submitterUser, reviewerUser, publisherUser, adminUser] = await db
    .insert(users)
    .values([
      {
        email: 'submitter@incidentmap.local',
        passwordHash: defaultPassword,
        role: 'submitter',
      },
      {
        email: 'reviewer@incidentmap.local',
        passwordHash: defaultPassword,
        role: 'reviewer',
      },
      {
        email: 'publisher@incidentmap.local',
        passwordHash: defaultPassword,
        role: 'publisher',
      },
      {
        email: 'admin@incidentmap.local',
        passwordHash: defaultPassword,
        role: 'admin',
      },
      // Convenience aliases requested by user
      {
        email: 'admin@example.com',
        passwordHash: defaultPassword,
        role: 'admin',
      },
      {
        email: 'reviewer@example.com',
        passwordHash: defaultPassword,
        role: 'reviewer',
      },
    ])
    .returning();

  console.log('✓ Users created:');
  console.log('  - submitter@incidentmap.local (role: submitter)');
  console.log('  - reviewer@incidentmap.local  (role: reviewer)');
  console.log('  - publisher@incidentmap.local (role: publisher)');
  console.log('  - admin@incidentmap.local     (role: admin)');
  console.log('  - reviewer@example.com        (role: reviewer)');
  console.log('  - admin@example.com           (role: admin)');
  console.log('  (Password for all seeded accounts: Password123!)');

  // 2. Seed 5 Fake Sample Incidents (all clearly marked as sample data)
  console.log('📍 Seeding 5 fake sample incidents (explicitly labeled [SAMPLE DATA])...');

  // Sample Incident 1: Published, Church Attack, Level 2, 2 Sources
  const [inc1] = await db
    .insert(incidents)
    .values({
      country: 'Nigeria',
      region: 'Kaduna State',
      district: 'Chikun LGA',
      locationPrecision: 'district',
      lat: 10.4328,
      lng: 7.4253,
      incidentDate: new Date('2025-06-12T09:30:00Z'),
      reportedDate: new Date('2025-06-13T10:00:00Z'),
      type: 'church_attack',
      victimCountMin: 3,
      victimCountMax: 8,
      perpetratorCategory: 'armed_group',
      neutralSummary:
        '[SAMPLE DATA] Unidentified armed assailants arrived on motorbikes during a Sunday morning gathering, discharging firearms into the facility structure and disrupting the service before retreating toward forest reserves.',
      legalStatus: 'reported',
      verificationLevel: 2,
      disputedFlag: false,
      status: 'published',
    })
    .returning();

  await db.insert(sources).values([
    {
      incidentId: inc1.id,
      url: 'https://example.org/sample-news/kaduna-incident-report-1',
      publisher: 'West Africa Monitor (Sample)',
      language: 'en',
      sourceType: 'news_report',
    },
    {
      incidentId: inc1.id,
      url: 'https://example.org/sample-ngo/peace-observatory-kaduna-brief',
      publisher: 'Regional Peace Observatory (Sample)',
      language: 'en',
      sourceType: 'ngo_report',
    },
  ]);

  // Sample Incident 2: Published, Blasphemy Prosecution, Level 3, 2 Sources
  const [inc2] = await db
    .insert(incidents)
    .values({
      country: 'Pakistan',
      region: 'Punjab',
      district: 'Faisalabad',
      locationPrecision: 'district',
      lat: 31.4504,
      lng: 73.135,
      incidentDate: new Date('2025-08-04T14:00:00Z'),
      reportedDate: new Date('2025-08-05T08:00:00Z'),
      type: 'blasphemy_prosecution',
      victimCountMin: 1,
      victimCountMax: 1,
      perpetratorCategory: 'state_authorities',
      neutralSummary:
        '[SAMPLE DATA] A formal First Information Report (FIR) was registered under national penal code penalizing religious commentary following a local market disagreement. Legal defense counsel submitted motions disputing procedural standing.',
      legalStatus: 'on_trial',
      verificationLevel: 3,
      disputedFlag: false,
      status: 'published',
    })
    .returning();

  await db.insert(sources).values([
    {
      incidentId: inc2.id,
      url: 'https://example.org/sample-court-records/case-fir-84920',
      publisher: 'Provincial Judicial Registry (Sample)',
      language: 'en',
      sourceType: 'court_document',
    },
    {
      incidentId: inc2.id,
      url: 'https://example.org/sample-ngo/human-rights-commission-docket',
      publisher: 'Independent Legal Aid Forum (Sample)',
      language: 'en',
      sourceType: 'ngo_report',
    },
  ]);

  // Sample Incident 3: In Review, Arrest / Detention, Level 2, 2 Sources
  const [inc3] = await db
    .insert(incidents)
    .values({
      country: 'Iran',
      region: 'Tehran Province',
      district: 'Tehran',
      locationPrecision: 'region',
      lat: 35.6892,
      lng: 51.389,
      incidentDate: new Date('2025-09-18T18:00:00Z'),
      reportedDate: new Date('2025-09-20T12:00:00Z'),
      type: 'arrest_detention',
      victimCountMin: 4,
      victimCountMax: 7,
      perpetratorCategory: 'police',
      neutralSummary:
        '[SAMPLE DATA] Security forces conducted an unannounced search at a private residential property during an informal devotional meeting. Several attendees were taken into administrative custody for questioning regarding unauthorized congregation.',
      legalStatus: 'charged',
      verificationLevel: 2,
      disputedFlag: false,
      status: 'in_review',
    })
    .returning();

  await db.insert(sources).values([
    {
      incidentId: inc3.id,
      url: 'https://example.org/sample-rights/middle-east-religious-freedom-bulletin',
      publisher: 'Middle East Freedom Initiative (Sample)',
      language: 'en',
      sourceType: 'ngo_report',
    },
    {
      incidentId: inc3.id,
      url: 'https://example.org/sample-media/tehran-local-reports-491',
      publisher: 'International Press Wire (Sample)',
      language: 'en',
      sourceType: 'news_report',
    },
  ]);

  // Sample Incident 4: Draft, Property Destruction, Level 1, 1 Source (Cannot be published per business rule)
  const [inc4] = await db
    .insert(incidents)
    .values({
      country: 'India',
      region: 'Chhattisgarh',
      district: 'Bastar',
      locationPrecision: 'district',
      lat: 19.0748,
      lng: 82.0152,
      incidentDate: new Date('2025-10-01T21:00:00Z'),
      reportedDate: new Date('2025-10-02T09:00:00Z'),
      type: 'property_destruction',
      victimCountMin: 2,
      victimCountMax: 4,
      perpetratorCategory: 'mob',
      neutralSummary:
        '[SAMPLE DATA] A community meeting hall was vandalized during the night by an organized crowd alleging unauthorized prayer activities. Local village elders requested police mediation.',
      legalStatus: 'reported',
      verificationLevel: 1, // Only level 1 & 1 source -> strictly cannot publish
      disputedFlag: true,
      status: 'draft',
    })
    .returning();

  await db.insert(sources).values([
    {
      incidentId: inc4.id,
      url: 'https://example.org/sample-news/bastar-district-dispute',
      publisher: 'Central India Gazette (Sample)',
      language: 'en',
      sourceType: 'news_report',
    },
  ]);

  // Sample Incident 5: Retracted, Kidnapping, Level 2, 2 Sources + Incident Change Log
  const [inc5] = await db
    .insert(incidents)
    .values({
      country: 'Democratic Republic of the Congo',
      region: 'North Kivu',
      district: 'Beni Territory',
      locationPrecision: 'district',
      lat: 0.4911,
      lng: 29.4731,
      incidentDate: new Date('2025-05-10T16:00:00Z'),
      reportedDate: new Date('2025-05-11T11:00:00Z'),
      type: 'kidnapping',
      victimCountMin: 2,
      victimCountMax: 2,
      perpetratorCategory: 'armed_group',
      neutralSummary:
        '[SAMPLE DATA] [RETRACTED] Initial reports indicated two community members were abducted along a rural highway by suspected militia operatives. Subsequent field investigation established this was a financial extortion dispute unrelated to religious affiliation.',
      legalStatus: 'dismissed',
      verificationLevel: 2,
      disputedFlag: true,
      status: 'retracted',
    })
    .returning();

  await db.insert(sources).values([
    {
      incidentId: inc5.id,
      url: 'https://example.org/sample-news/beni-security-update-may',
      publisher: 'Kivu News Service (Sample)',
      language: 'fr',
      sourceType: 'news_report',
    },
    {
      incidentId: inc5.id,
      url: 'https://example.org/sample-ngo/peace-monitoring-beni-dossier',
      publisher: 'Great Lakes Observatory (Sample)',
      language: 'fr',
      sourceType: 'ngo_report',
    },
  ]);

  // Add mandatory incident change log for the retracted incident
  await db.insert(incidentChanges).values({
    incidentId: inc5.id,
    userId: publisherUser.id,
    whatChanged: {
      field: 'status',
      from: 'published',
      to: 'retracted',
    },
    reason:
      '[SAMPLE DATA] Independent field corroboration concluded the incident was a private commercial debt dispute rather than an anti-religious abduction. In accordance with policy, the record is maintained with retracted status.',
    publicFlag: true,
  });

  console.log('✓ 5 fake sample incidents successfully seeded:');
  console.log('  1. Nigeria (Church Attack) -> status: published (Level 2, 2 sources)');
  console.log('  2. Pakistan (Blasphemy Prosecution) -> status: published (Level 3, 2 sources)');
  console.log('  3. Iran (Arrest/Detention) -> status: in_review (Level 2, 2 sources)');
  console.log('  4. India (Property Destruction) -> status: draft (Level 1, 1 source - publisher blocked)');
  console.log('  5. DR Congo (Kidnapping) -> status: retracted (with public incident_changes log)');
  console.log('✅ Seeding completed successfully!');
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
