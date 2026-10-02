'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { useAppState } from '@/store/provider';
import { useEmployerCopy } from './common';

const Scope = createContext<{
  employerId: string;
  setEmployerId: (id: string) => void;
  companyId: string;
  setCompanyId: (id: string) => void;
} | null>(null);

export function EmployerScopeProvider({ children }: { children: ReactNode }) {
  const [employerId, setEmployerId] = useState('emp_gulf_meridian');
  const [companyId, setCompanyId] = useState('');
  return (
    <Scope.Provider value={{ employerId, setEmployerId, companyId, setCompanyId }}>
      {children}
    </Scope.Provider>
  );
}

export function useEmployerScope() {
  const scope = useContext(Scope);
  if (!scope) throw new Error('EmployerScopeProvider is required');
  const state = useAppState();
  return { ...scope, employer: state.employers[scope.employerId] };
}

export function EmployerScopePicker() {
  const state = useAppState();
  const { employerId, setEmployerId } = useEmployerScope();
  const { e } = useEmployerCopy();
  return (
    <label className="flex min-w-0 items-center gap-2 text-label text-fg-secondary">
      <Building2 aria-hidden className="size-4 shrink-0" />
      <span className="sr-only">{e('Employer records', 'سجلات صاحب العمل')}</span>
      <select
        aria-label={e('Employer records', 'سجلات صاحب العمل')}
        value={employerId}
        onChange={(event) => setEmployerId(event.target.value)}
        className="h-9 max-w-full min-w-0 rounded-lg border border-line-strong bg-surface px-2 text-label text-fg"
      >
        {Object.values(state.employers).map((employer) => (
          <option key={employer.id} value={employer.id}>
            {employer.name}
          </option>
        ))}
      </select>
    </label>
  );
}
