import Link from 'next/link';
import { db, incidents } from '@/db';
import { eq } from 'drizzle-orm';
import {
  Globe,
  ShieldCheck,
  Lock,
  ArrowRight,
  Database,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

interface PublishedIncidentPreview {
  id: string;
  country: string;
  region: string | null;
  type: string;
  incidentDate: Date;
  neutralSummary: string;
  verificationLevel: number;
  victimCountMin: number;
  victimCountMax: number | null;
}

export default async function HomePage() {
  const session = await auth();

  // Public site reads ONLY from incidents table where status = 'published'
  let publishedIncidents: PublishedIncidentPreview[] = [];
  try {
    publishedIncidents = await db
      .select({
        id: incidents.id,
        country: incidents.country,
        region: incidents.region,
        type: incidents.type,
        incidentDate: incidents.incidentDate,
        neutralSummary: incidents.neutralSummary,
        verificationLevel: incidents.verificationLevel,
        victimCountMin: incidents.victimCountMin,
        victimCountMax: incidents.victimCountMax,
      })
      .from(incidents)
      .where(eq(incidents.status, 'published'))
      .limit(5);
  } catch {
    // If DB is not connected yet, display empty state
    publishedIncidents = [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                Incident Map
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-amber-400/90 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Phase 1 Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-semibold hover:bg-amber-300 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Go to Reviewer Area ({session.user.role})
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Reviewer / Admin Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Human-Verified Global Documentation System
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Searchable Database & Global Map of Verified Incidents
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            A secure repository of verified incidents affecting Christians worldwide.
            Designed around rigorous verification levels, dual-source requirements, and human editorial review.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-amber-400 text-slate-950 text-sm font-semibold hover:bg-amber-300 transition-colors inline-flex items-center gap-2 shadow-lg shadow-amber-500/10"
            >
              Access Reviewer & Admin Console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Core Architectural Rule Box */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Core Architectural Safeguard</h2>
              <p className="text-xs text-slate-400">Strict separation between raw intake and public data</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-white">Rule:</strong> Nothing goes public without human review. Collected leads are stored in{' '}
            <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">raw_items</code> and never exposed directly. The public platform strictly reads from{' '}
            <code className="text-emerald-300 font-mono bg-black/40 px-1 py-0.5 rounded">incidents</code> where{' '}
            <code className="text-emerald-300 font-mono bg-black/40 px-1 py-0.5 rounded">status = &apos;published&apos;</code>.
            An incident must have at least <strong>2 independent sources</strong> and a <strong>verification level ≥ 2</strong> before the server permits publication by a designated publisher.
          </p>
        </div>

        {/* Phase 1 Verification / Published Data Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">
                Public Published Feed Preview (Phase 1 Seed Data)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Only showing items where <code className="font-mono text-emerald-400">status = &apos;published&apos;</code>
            </span>
          </div>

          {publishedIncidents.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
              <AlertCircle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <p>No published incidents found in database yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Configure your Neon database in <code className="font-mono text-slate-300">.env</code> and run <code className="font-mono text-slate-300">npm run db:seed</code> to populate sample records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="text-sm font-semibold text-white">
                        {inc.country} {inc.region ? `• ${inc.region}` : ''}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Published
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {inc.neutralSummary}
                  </p>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize text-slate-300">
                      Type: {inc.type.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-emerald-400">
                      Level {inc.verificationLevel} Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Incident Map &copy; 2026. Built with Next.js App Router, Neon Postgres, PostGIS, Drizzle ORM, and Auth.js.
      </footer>
    </div>
  );
}
