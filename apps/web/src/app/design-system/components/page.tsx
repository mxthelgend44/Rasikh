'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Inbox, Plus, Trash2 } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Menu } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr, type SortDirection } from '@/components/ui/table';

interface SampleHire {
  name: string;
  role: string;
  from: string;
  stage: string;
  tone: BadgeTone;
  days: number;
}

/** Page-local sample rows for the gallery only. The real seed arrives with the data model. */
const HIRES: SampleHire[] = [
  { name: 'Aditi Rao', role: 'Backend engineer', from: 'Bengaluru', stage: 'Emirates ID', tone: 'accent', days: 9 },
  { name: 'Samuel Okoye', role: 'Registered nurse', from: 'Lagos', stage: 'Blocked', tone: 'danger', days: 21 },
  { name: 'Mei Lin Tan', role: 'Data scientist', from: 'Singapore', stage: 'Housing', tone: 'neutral', days: 14 },
  { name: 'Carlos Mendes', role: 'Site engineer', from: 'São Paulo', stage: 'Settled', tone: 'success', days: 26 },
  { name: 'Fatima El Idrissi', role: 'Primary teacher', from: 'Casablanca', stage: 'Documents', tone: 'warning', days: 3 },
];

type SortKey = 'name' | 'days';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="mb-3 text-body font-medium text-fg">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export default function ComponentsPage() {
  const [view, setView] = useState<'list' | 'board'>('list');
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'days',
    direction: 'desc',
  });

  const rows = useMemo(() => {
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...HIRES].sort((a, b) =>
      sort.key === 'days' ? (a.days - b.days) * factor : a.name.localeCompare(b.name) * factor,
    );
  }, [sort]);

  const toggle = (key: SortKey) =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  const sortOf = (key: SortKey) => (sort.key === key ? sort.direction : 'none');

  return (
    <>
      <PageHeader
        title="Components"
        tabs={
          <Segmented
            label="Layout"
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'List' },
              { value: 'board', label: 'Board' },
            ]}
          />
        }
        actions={<Button icon={<Plus />}>Add hire</Button>}
      />

      <div className="px-6 py-6">
        <Section title="Buttons">
          <div className="flex flex-col gap-3">
            <Row>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Remove access</Button>
              <Button icon={<Plus />}>With icon</Button>
              <Button variant="secondary" iconOnly aria-label="Delete" icon={<Trash2 />} />
            </Row>
            <Row>
              <Button size="sm">Small</Button>
              <Button>Medium</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </Row>
          </div>
        </Section>

        <Section title="Status labels">
          <div className="flex flex-col gap-3">
            <Row>
              <Badge>Draft</Badge>
              <Badge tone="accent">Employer backed</Badge>
              <Badge tone="success">Approved</Badge>
              <Badge tone="warning">Waiting on documents</Badge>
              <Badge tone="danger">Blocked</Badge>
            </Row>
            <Row>
              <Badge shape="pill">Draft</Badge>
              <Badge shape="pill" tone="accent">
                Employer backed
              </Badge>
              <Badge shape="pill" tone="success">
                Approved
              </Badge>
              <Badge shape="pill" tone="warning">
                Waiting
              </Badge>
              <Badge shape="pill" tone="danger">
                Blocked
              </Badge>
            </Row>
          </div>
        </Section>

        <Section title="Menu">
          <Menu
            label="Hire actions"
            items={[
              { id: 'open', label: 'Open profile', onSelect: () => undefined },
              { id: 'back', label: 'Back this hire', onSelect: () => undefined, selected: true },
              { id: 'remove', label: 'Remove', onSelect: () => undefined, disabled: true },
            ]}
            trigger={(props) => (
              <Button variant="secondary" {...props}>
                Actions
              </Button>
            )}
          />
        </Section>

        <Section title="Table">
          <div className="overflow-hidden rounded-lg border border-edge">
            <Table>
              <caption className="sr-only">Hires in relocation</caption>
              <thead>
                <tr>
                  <Th sort={sortOf('name')} onSort={() => toggle('name')}>
                    Name
                  </Th>
                  <Th>Role</Th>
                  <Th>Moving from</Th>
                  <Th>Stage</Th>
                  <Th align="end" sort={sortOf('days')} onSort={() => toggle('days')}>
                    Days
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((hire) => (
                  <Tr key={hire.name}>
                    <Td className="font-medium">{hire.name}</Td>
                    <Td className="text-fg-secondary">{hire.role}</Td>
                    <Td className="text-fg-secondary">{hire.from}</Td>
                    <Td>
                      <Badge tone={hire.tone}>{hire.stage}</Badge>
                    </Td>
                    <Td align="end" className="tabular-nums">
                      {hire.days}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Section>

        <Section title="Loading and empty">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-lg border border-edge p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </div>
            <div className="rounded-lg border border-edge">
              <EmptyState
                icon={Inbox}
                title="No applications yet"
                description="When a tenant applies, the application and its risk summary appear here."
                action={<Button icon={<Plus />}>Add property</Button>}
              />
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
