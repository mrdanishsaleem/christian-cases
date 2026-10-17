import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db, incidents, sources, incidentChanges, Incident, Source, IncidentChange } from '@/db';
import { logoutAction } from '@/app/login/actions';
import { validatePublishEligibility } from '@/lib/validations/incident';
import { eq, desc } from 'drizzle-orm';
import {
  ShieldCheck,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  History,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface IncidentWithDetails extends Incident {
  sources: Source[];
  changes: IncidentChange[];
  eligibility: { allowed: boolean; errors: string[] };
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const currentUser = session.user;

  // Query all seeded incidents with their sources and changes
  let allIncidents: IncidentWithDetails[] = [];
  let errorLoading: string | null = null;

  try {
    const rawIncidents = await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.createdAt));

    allIncidents = await Promise.all(
      rawIncidents.map(async (inc): Promise<IncidentWithDetails> => {
        const attachedSources = await db
          .select()
          .from(sources)
          .where(eq(sources.incidentId, inc.id));

        const changes = await db
          .select()
          .from(incidentChanges)
          .where(eq(incidentChanges.incidentId, inc.id));

        const eligibility = validatePublishEligibility({
          userRole: currentUser.role,
          verificationLevel: inc.verificationLevel,
          sourceCount: attachedSources.length,
        });

        return {
          ...inc,
          sources: attachedSources,
          changes,
          eligibility,
        };
      })
    );
  } catch (err: unknown) {
    errorLoading = err instanceof Error ? err.message : 'Database not connected or pending migrations.';
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-900/60 text-purple-200 border-purple-500/40',
    publisher: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40',
    reviewer: 'bg-blue-900/60 text-blue-200 border-blue-500/40',
    submitter: 'bg-amber-900/60 text-amber-200 border-amber-500/40',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              IM
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">
                Incident Map Review Area
              </h1>
              <p className="text-xs text-slate-400">Phase 1: Verification & Role Checks</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-200">{currentUser.email}</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  roleColors[currentUser.role] || 'bg-slate-700'
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role Enforcement Diagnostic Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">
                Server-Side Role & Rule Enforcement
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Active User: <strong className="text-white">{currentUser.role}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Publisher Privilege
              </div>
              <div className="flex items-center gap-2 mt-2">
                {currentUser.role === 'publisher' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Authorized</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">
                      Restricted (Publisher Only)
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Server rejects publish actions if user role != publisher.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reviewer Access
              </div>
              <div className="flex items-center gap-2 mt-2">
                {['reviewer', 'publisher', 'admin'].includes(currentUser.role) ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Permitted</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">Denied</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Can evaluate leads, edit drafts, and assign verification levels.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Admin Console
              </div>
              <div className="flex items-center gap-2 mt-2">
                {currentUser.role === 'admin' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">Full Admin</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">Standard Reviewer</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                User management, audit trails, and system maintenance.
              </p>
            </div>
          </div>
        </div>

        {/* Database Incident Verification View */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Seeded Sample Incidents & Rule Compliance
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Verifying the 5 sample incidents, minimum sources requirement, and verification level gates.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              Total Seeded: {allIncidents.length}
            </span>
          </div>

          {errorLoading ? (
            <div className="p-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Database Connection Note:
              </div>
              <p>{errorLoading}</p>
              <p className="mt-2 text-xs text-amber-400/80">
                Ensure <code className="font-mono bg-black/30 px-1 py-0.5 rounded">DATABASE_URL</code> is set in your <code className="font-mono bg-black/30 px-1 py-0.5 rounded">.env</code> file and run <code className="font-mono bg-black/30 px-1 py-0.5 rounded">npm run db:push && npm run db:seed</code>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-5 rounded-lg bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-white">
                        {inc.country} ({inc.type.replace('_', ' ')})
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          inc.status === 'published'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : inc.status === 'retracted'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : inc.status === 'in_review'
                            ? 'bg-blue-950 text-blue-400 border-blue-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>
                        Verification Level:{' '}
                        <strong className="text-slate-200">Level {inc.verificationLevel}</strong>
                      </span>
                      <span>
                        Sources:{' '}
                        <strong className="text-slate-200">{inc.sources.length}</strong>
                      </span>
                      <span>
                        Victim Count:{' '}
                        <strong className="text-slate-200">
                          {inc.victimCountMin}
                          {inc.victimCountMax ? ` - ${inc.victimCountMax}` : '+'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {inc.neutralSummary}
                  </p>

                  {/* Sources List */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-500">Sources:</span>
                    {inc.sources.length === 0 ? (
                      <span className="text-red-400 italic">No sources attached</span>
                    ) : (
                      inc.sources.map((src: Source) => (
                        <span
                          key={src.id}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                        >
                          {src.publisher} ({src.sourceType})
                        </span>
                      ))
                    )}
                  </div>

                  {/* Changes / Retraction log if present */}
                  {inc.changes.length > 0 && (
                    <div className="mt-3 p-3 rounded bg-rose-950/20 border border-rose-900/40 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
                        <History className="h-3.5 w-3.5" />
                        Audit / Retraction Log Entry:
                      </div>
                      <p className="text-rose-300/90 text-[11px]">
                        {inc.changes[0].reason}
                      </p>
                    </div>
                  )}

                  {/* Publish Rule Status Gate */}
                  <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {inc.eligibility.allowed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">
                            Meets Server Publish Criteria
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-amber-300">
                            Server Publish Gate:{' '}
                            <span className="text-slate-400">
                              {inc.eligibility.errors.join(' ')}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500">
                      Approx. Coordinates: {inc.lat}, {inc.lng}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
