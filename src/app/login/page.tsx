'use client';

import { useActionState, useState } from 'react';
import { loginAction, LoginActionState } from './actions';
import { Shield, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const PRESET_ACCOUNTS = [
  { role: 'Admin', email: 'admin@example.com', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  { role: 'Reviewer', email: 'reviewer@example.com', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  { role: 'Publisher', email: 'publisher@incidentmap.local', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    null
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');

  const fillCredentials = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Reviewer & Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Incident Map — Verified Global Records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {state?.error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email address
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-400 disabled:opacity-50"
            >
              {isPending ? 'Authenticating...' : 'Sign in to Review Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick preset selector for testing Phase 1 logins */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-3">
              Phase 1 Quick-Select Test Accounts (Password: Password123!)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillCredentials(acc.email)}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs transition-colors"
                >
                  <span className="font-mono text-slate-300">{acc.email}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${acc.badge}`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
