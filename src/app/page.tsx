'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

type View = 'overview' | 'steps' | 'documents' | 'places';
type Route = 'new-hire' | 'family' | 'team';
type Filter = 'all' | 'todo' | 'done';
type Task = {
  id: string;
  title: string;
  summary: string;
  phase: string;
  owner: string;
  checklist: string[];
};
type CustomTask = { id: string; route: Route; title: string };
type SavedData = {
  route: Route;
  completed: string[];
  checkedItems: string[];
  documents: string[];
  savedPlaces: string[];
  notes: Record<string, string>;
  customTasks: CustomTask[];
};

const routeOptions: { id: Route; label: string; arabic: string }[] = [
  { id: 'new-hire', label: 'Starting a new job', arabic: 'عمل جديد' },
  { id: 'family', label: 'Moving with family', arabic: 'مع العائلة' },
  { id: 'team', label: 'Bringing a team', arabic: 'فريق عمل' },
];

const tasksByRoute: Record<Route, Task[]> = {
  'new-hire': [
    {
      id: 'hire-offer',
      title: 'Confirm your arrival route',
      summary: 'Ask your employer which work and residence path applies.',
      phase: 'Before arrival',
      owner: 'You + employer',
      checklist: [
        'Confirm the route with your employer',
        'Keep your offer letter handy',
        'Note your expected arrival date',
      ],
    },
    {
      id: 'hire-docs',
      title: 'Get your documents ready',
      summary: 'Make one list of the records you may need.',
      phase: 'Before arrival',
      owner: 'You',
      checklist: [
        'Check your passport validity',
        'Keep an offer letter copy',
        'Ask if qualifications need recognition',
      ],
    },
    {
      id: 'hire-residence',
      title: 'Follow your official steps',
      summary: 'Track work, residence and Emirates ID milestones.',
      phase: 'Arrival',
      owner: 'Employer + official services',
      checklist: [
        'Ask for the application reference',
        'Confirm the next medical or biometrics step',
        'Save the official status link',
      ],
    },
    {
      id: 'hire-home',
      title: 'Prepare for a home',
      summary: 'Shortlist an area and ask landlords what they need.',
      phase: 'Settling in',
      owner: 'You + landlord',
      checklist: [
        'Save an area to explore',
        'Ask the chosen landlord for their checklist',
        'Review the tenancy details',
      ],
    },
    {
      id: 'hire-bank',
      title: 'Check your banking options',
      summary: 'Compare account requirements before applying.',
      phase: 'Settling in',
      owner: 'You + bank',
      checklist: [
        'Choose a bank product to ask about',
        'Check its ID and salary requirements',
        'Keep the bank’s decision separate from your plan',
      ],
    },
    {
      id: 'hire-utilities',
      title: 'Get the essentials connected',
      summary: 'Confirm tenancy and utility account status.',
      phase: 'Settling in',
      owner: 'You + utility provider',
      checklist: [
        'Confirm your tenancy registration',
        'Check how the utility account is created',
        'Save your account reference when issued',
      ],
    },
  ],
  family: [
    {
      id: 'family-route',
      title: 'Map your household move',
      summary: 'Put work and family steps in one place.',
      phase: 'Before arrival',
      owner: 'You + family',
      checklist: [
        'Confirm the work route',
        'List family members moving',
        'Ask which documents need attestation',
      ],
    },
    {
      id: 'family-docs',
      title: 'Gather family records',
      summary: 'Keep identity, kinship and school records ready.',
      phase: 'Before arrival',
      owner: 'Family',
      checklist: [
        'Check passports',
        'Gather kinship documents',
        'Request school transfer records if needed',
      ],
    },
    {
      id: 'family-home',
      title: 'Sort your housing plan',
      summary: 'Find a place that fits everyday life.',
      phase: 'Settling in',
      owner: 'You + landlord',
      checklist: [
        'Save areas to explore',
        'Ask the landlord for actual requirements',
        'Keep the registered tenancy record',
      ],
    },
    {
      id: 'family-residence',
      title: 'Arrange family residence',
      summary: 'Check the official sponsor and housing conditions.',
      phase: 'After arrival',
      owner: 'You + official services',
      checklist: [
        'Confirm sponsor residence status',
        'Check housing and insurance evidence',
        'Follow the official application route',
      ],
    },
    {
      id: 'family-school',
      title: 'Prepare for school',
      summary: 'Ask a chosen school about places and documents.',
      phase: 'After arrival',
      owner: 'Family + school',
      checklist: [
        'Contact a chosen school',
        'Ask about identity and transfer records',
        'Confirm any temporary ID arrangement',
      ],
    },
  ],
  team: [
    {
      id: 'team-route',
      title: 'Choose the right setup route',
      summary: 'Match the company activity to the right authority.',
      phase: 'Company setup',
      owner: 'Founder + setup authority',
      checklist: [
        'Describe the business activity',
        'Compare mainland and relevant zones',
        'Confirm any sector approvals',
      ],
    },
    {
      id: 'team-license',
      title: 'Get the company ready',
      summary: 'Track licensing and establishment prerequisites.',
      phase: 'Company setup',
      owner: 'Company + official services',
      checklist: [
        'Confirm the licensing path',
        'Prepare the company file',
        'Check when the entity can sponsor hires',
      ],
    },
    {
      id: 'team-hires',
      title: 'Plan each hire’s arrival',
      summary: 'Give each person an owner and a route.',
      phase: 'Team move',
      owner: 'HR + new hires',
      checklist: [
        'List incoming hires',
        'Confirm each work route',
        'Share the next action with each hire',
      ],
    },
    {
      id: 'team-homes',
      title: 'Support the first weeks',
      summary: 'Keep housing and banking handoffs visible.',
      phase: 'Team move',
      owner: 'HR + new hires',
      checklist: [
        'Ask hires what support they need',
        'Track housing handoffs',
        'Track account setup questions',
      ],
    },
  ],
};

const navItems: { id: View; label: string; arabic: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', arabic: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'steps', label: 'My steps', arabic: 'خطواتي', icon: ClipboardList },
  { id: 'documents', label: 'Documents', arabic: 'مستنداتي', icon: FileText },
  { id: 'places', label: 'Places', arabic: 'الأماكن', icon: MapPin },
];

const places = [
  {
    id: 'corniche',
    title: 'The Corniche',
    type: 'Waterfront walks',
    detail: 'A familiar first stop by the sea, with room to walk, cycle and take in the city.',
    image: '/images/corniche-arrival.webp',
  },
  {
    id: 'heritage',
    title: 'Heritage courtyards',
    type: 'Culture & gathering',
    detail: 'A reminder that a move is also about finding people and a sense of place.',
    image: '/images/heritage-courtyard.webp',
  },
  {
    id: 'mangroves',
    title: 'The mangroves',
    type: 'Nature nearby',
    detail: 'Quiet coastal green space close to Abu Dhabi’s city rhythm.',
    image: '/images/mangroves.webp',
  },
];

const suggestedDocuments = [
  'Passport copy',
  'Offer letter',
  'Salary certificate',
  'School records',
];
const storageKey = 'rasikh-local-preview-v1';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

function arabicIndex(index: number) {
  return String(index + 1)
    .padStart(2, '0')
    .replace(/\d/g, (digit) => arabicDigits[Number(digit)]);
}

export default function HomePage() {
  const [view, setView] = useState<View>('overview');
  const [route, setRoute] = useState<Route>('new-hire');
  const [filter, setFilter] = useState<Filter>('all');
  const [completed, setCompleted] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [loaded, setLoaded] = useState(false);
  const dialogCloseButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedData>;
        if (saved.route && routeOptions.some((item) => item.id === saved.route))
          setRoute(saved.route);
        if (Array.isArray(saved.completed))
          setCompleted(saved.completed.filter((item) => typeof item === 'string'));
        if (Array.isArray(saved.checkedItems))
          setCheckedItems(saved.checkedItems.filter((item) => typeof item === 'string'));
        if (Array.isArray(saved.documents))
          setDocuments(saved.documents.filter((item) => typeof item === 'string'));
        if (Array.isArray(saved.savedPlaces))
          setSavedPlaces(saved.savedPlaces.filter((item) => typeof item === 'string'));
        if (saved.notes && typeof saved.notes === 'object' && !Array.isArray(saved.notes)) {
          setNotes(
            Object.fromEntries(
              Object.entries(saved.notes).filter((entry) => typeof entry[1] === 'string'),
            ),
          );
        }
        if (Array.isArray(saved.customTasks)) {
          setCustomTasks(
            saved.customTasks.filter(
              (item) =>
                item &&
                typeof item.id === 'string' &&
                typeof item.title === 'string' &&
                routeOptions.some((option) => option.id === item.route),
            ),
          );
        }
      }
    } catch {
      // The preview remains usable if local storage is unavailable.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data: SavedData = {
      route,
      completed,
      checkedItems,
      documents,
      savedPlaces,
      notes,
      customTasks,
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      /* Local storage can be disabled. */
    }
  }, [loaded, route, completed, checkedItems, documents, savedPlaces, notes, customTasks]);

  useEffect(() => {
    if (!activeTaskId) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogCloseButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveTaskId(null);
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [activeTaskId]);

  const tasks: Task[] = [
    ...tasksByRoute[route],
    ...customTasks
      .filter((task) => task.route === route)
      .map((task) => ({
        id: task.id,
        title: task.title,
        summary: 'A step you added to your plan.',
        phase: 'Your own step',
        owner: 'You',
        checklist: [],
      })),
  ];
  const completedCount = tasks.filter((task) => completed.includes(task.id)).length;
  const progress = Math.round((completedCount / tasks.length) * 100);
  const nextTasks = tasks.filter((task) => !completed.includes(task.id)).slice(0, 3);
  const visibleTasks = tasks.filter(
    (task) =>
      filter === 'all' ||
      (filter === 'done' ? completed.includes(task.id) : !completed.includes(task.id)),
  );
  const activeTask = tasks.find((task) => task.id === activeTaskId);

  function toggleCompleted(id: string) {
    setCompleted((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }
  function toggleCheck(key: string) {
    setCheckedItems((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
    );
  }
  function openTask(task: Task) {
    setActiveTaskId(task.id);
    setNoteDraft(notes[task.id] || '');
  }
  function addCustomTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim().slice(0, 90);
    if (!title) return;
    setCustomTasks((previous) => [
      ...previous,
      { id: 'custom-' + crypto.randomUUID(), route, title },
    ]);
    setNewTask('');
    setFilter('all');
  }
  function addDocument(name: string) {
    const clean = name.trim().slice(0, 80);
    if (!clean || hasDocument(clean)) return;
    setDocuments((previous) => [...previous, clean]);
    setNewDocument('');
  }
  function hasDocument(name: string) {
    return documents.some((item) => item.toLowerCase() === name.toLowerCase());
  }
  function removeCustomTask(id: string) {
    setCustomTasks((previous) => previous.filter((item) => item.id !== id));
    setCompleted((previous) => previous.filter((item) => item !== id));
    setCheckedItems((previous) => previous.filter((item) => !item.startsWith(id + '::')));
    setNotes((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    if (activeTaskId === id) setActiveTaskId(null);
  }
  function togglePlace(id: string) {
    setSavedPlaces((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }
  function changeView(next: View) {
    setView(next);
    setActiveTaskId(null);
  }

  function taskRow(task: Task) {
    const done = completed.includes(task.id);
    return (
      <article className={done ? 'app-task-row is-done' : 'app-task-row'} key={task.id}>
        <button
          type="button"
          className="app-task-check"
          aria-label={done ? 'Mark ' + task.title + ' to do' : 'Mark ' + task.title + ' done'}
          aria-pressed={done}
          onClick={() => toggleCompleted(task.id)}
        >
          {done && <Check size={17} strokeWidth={2.3} />}
        </button>
        <div className="app-task-number" aria-hidden="true">
          {arabicIndex(tasks.findIndex((item) => item.id === task.id))}
        </div>
        <div className="app-task-copy">
          <span className="app-task-phase">
            {task.phase} · {task.owner}
          </span>
          <h3>{task.title}</h3>
          <p>{task.summary}</p>
        </div>
        <div className="app-task-actions">
          <button type="button" className="app-open-step" onClick={() => openTask(task)}>
            Open step{' '}
            <span lang="ar" dir="rtl">
              عرض الخطوة
            </span>
            <ArrowUpRight size={17} />
          </button>
          {task.id.startsWith('custom-') && (
            <button
              type="button"
              className="app-remove-step"
              aria-label={'Remove ' + task.title}
              onClick={() => removeCustomTask(task.id)}
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
      </article>
    );
  }

  function navigation() {
    return navItems.map(({ id, label, arabic, icon: Icon }) => (
      <button
        type="button"
        key={id}
        className={view === id ? 'app-nav-item is-active' : 'app-nav-item'}
        aria-current={view === id ? 'page' : undefined}
        onClick={() => changeView(id)}
      >
        <Icon size={19} strokeWidth={1.75} />
        <span>
          <strong>{label}</strong>
          <small lang="ar" dir="rtl">
            {arabic}
          </small>
        </span>
      </button>
    ));
  }

  return (
    <div className="app-page">
      <header className="app-topbar">
        <Link className="app-brand" href="/" aria-label="Rasikh dashboard">
          <span className="app-brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Rasikh{' '}
            <small lang="ar" dir="rtl">
              راسخ
            </small>
          </span>
        </Link>
        <div className="app-topbar-right">
          <span className="app-location">
            <MapPin size={16} /> Abu Dhabi, UAE
          </span>
          <span className="app-preview-badge">LOCAL PREVIEW</span>
          <a href="/welcome" className="app-about-link">
            About Rasikh <ArrowUpRight size={16} />
          </a>
        </div>
      </header>
      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="app-sidebar-label">
            YOUR SPACE{' '}
            <span lang="ar" dir="rtl">
              مساحتك
            </span>
          </div>
          <nav className="app-side-nav" aria-label="Dashboard navigation">
            {navigation()}
          </nav>
          <div className="app-sidebar-note">
            <span className="app-sidebar-motif" aria-hidden="true">
              ✳
            </span>
            <strong>A place to begin.</strong>
            <p>
              Your changes stay on this device. Nothing here is sent to an authority or provider.
            </p>
          </div>
        </aside>
        <main className="app-main">
          <nav className="app-mobile-nav" aria-label="Dashboard sections">
            {navigation()}
          </nav>
          {view === 'overview' && (
            <>
              <section className="app-welcome" aria-labelledby="app-welcome-title">
                <div className="app-welcome-copy">
                  <span className="app-kicker">
                    <span lang="ar" dir="rtl">
                      مرحباً
                    </span>{' '}
                    · MARHABA
                  </span>
                  <h1 id="app-welcome-title">
                    Let&apos;s make one thing <em>easier today.</em>
                  </h1>
                  <p>
                    Your move has many parts. Start with the next clear step and keep the rest in
                    view.
                  </p>
                  <button
                    type="button"
                    className="app-primary-button"
                    onClick={() => changeView('steps')}
                  >
                    Open my steps{' '}
                    <span lang="ar" dir="rtl">
                      خطواتي
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </div>
                <div className="app-welcome-image">
                  <Image
                    src="/images/corniche-arrival.webp"
                    alt="Illustrative Abu Dhabi Corniche scene"
                    fill
                    priority
                    sizes="(max-width: 800px) 100vw, 35vw"
                  />
                  <span>
                    <MapPin size={14} /> THE CORNICHE
                  </span>
                </div>
              </section>
              <div className="app-page-heading app-overview-heading">
                <div>
                  <span className="app-kicker">
                    YOUR PLAN{' '}
                    <span lang="ar" dir="rtl">
                      خطتك
                    </span>
                  </span>
                  <h2>At a glance</h2>
                </div>
                <button
                  type="button"
                  className="app-text-button"
                  onClick={() => changeView('steps')}
                >
                  View all steps <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="app-route-picker" role="group" aria-label="Choose your type of move">
                {routeOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={route === item.id}
                    className={
                      route === item.id ? 'app-route-button is-active' : 'app-route-button'
                    }
                    onClick={() => setRoute(item.id)}
                  >
                    <span>{item.label}</span>
                    <small lang="ar" dir="rtl">
                      {item.arabic}
                    </small>
                  </button>
                ))}
              </div>
              <div className="app-stats">
                <div>
                  <strong>
                    {completedCount}
                    <span>/{tasks.length}</span>
                  </strong>
                  <small>steps completed</small>
                </div>
                <div>
                  <strong>{documents.length}</strong>
                  <small>documents tracked</small>
                </div>
                <div>
                  <strong>{savedPlaces.length}</strong>
                  <small>places saved</small>
                </div>
                <div className="app-progress-stat">
                  <strong>{progress}%</strong>
                  <small>of your sample plan</small>
                  <span className="app-progress-track">
                    <span style={{ width: progress + '%' }} />
                  </span>
                </div>
              </div>
              <div className="app-content-grid">
                <section className="app-panel" aria-labelledby="next-steps-title">
                  <div className="app-panel-heading">
                    <div>
                      <span className="app-kicker">
                        NEXT UP{' '}
                        <span lang="ar" dir="rtl">
                          التالي
                        </span>
                      </span>
                      <h2 id="next-steps-title">Your next steps</h2>
                    </div>
                    <button
                      type="button"
                      className="app-icon-link"
                      aria-label="View all steps"
                      onClick={() => changeView('steps')}
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                  {nextTasks.length ? (
                    <div className="app-task-list">{nextTasks.map(taskRow)}</div>
                  ) : (
                    <div className="app-empty">
                      <Check size={27} />
                      <h3>All caught up.</h3>
                      <p>
                        You have completed every step in this sample route. You can still add your
                        own.
                      </p>
                      <button type="button" onClick={() => changeView('steps')}>
                        Add a step <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </section>
                <aside className="app-quick-panel">
                  <span className="app-kicker">
                    QUICK ACTIONS{' '}
                    <span lang="ar" dir="rtl">
                      إجراءات سريعة
                    </span>
                  </span>
                  <h2>Keep moving.</h2>
                  <button type="button" onClick={() => changeView('documents')}>
                    <FileText size={20} />
                    <span>
                      Track a document
                      <small lang="ar" dir="rtl">
                        أضف مستنداً
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                  <button type="button" onClick={() => changeView('places')}>
                    <Home size={20} />
                    <span>
                      Save a place
                      <small lang="ar" dir="rtl">
                        احفظ مكاناً
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                  <a href="/welcome">
                    <span className="app-quick-ornament" aria-hidden="true">
                      ✳
                    </span>
                    <span>
                      Get to know Rasikh<small>Our idea and the city behind it</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </a>
                </aside>
              </div>
            </>
          )}

          {view === 'steps' && (
            <section className="app-view-section" aria-labelledby="steps-title">
              <div className="app-page-heading">
                <div>
                  <span className="app-kicker">
                    YOUR JOURNEY{' '}
                    <span lang="ar" dir="rtl">
                      رحلتك
                    </span>
                  </span>
                  <h1 id="steps-title">My steps</h1>
                  <p>
                    Pick one thing to move forward. This is a sample plan you can edit on this
                    device.
                  </p>
                </div>
                <div className="app-heading-symbol" aria-hidden="true">
                  ✳
                </div>
              </div>
              <div className="app-route-picker" role="group" aria-label="Choose your type of move">
                {routeOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={route === item.id}
                    className={
                      route === item.id ? 'app-route-button is-active' : 'app-route-button'
                    }
                    onClick={() => setRoute(item.id)}
                  >
                    <span>{item.label}</span>
                    <small lang="ar" dir="rtl">
                      {item.arabic}
                    </small>
                  </button>
                ))}
              </div>
              <div className="app-steps-toolbar">
                <span>
                  {completedCount} of {tasks.length} complete
                </span>
                <div className="app-filters" role="group" aria-label="Filter steps">
                  {(['all', 'todo', 'done'] as Filter[]).map((item) => (
                    <button
                      type="button"
                      key={item}
                      aria-pressed={filter === item}
                      className={filter === item ? 'is-active' : ''}
                      onClick={() => setFilter(item)}
                    >
                      {item === 'all' ? 'All' : item === 'todo' ? 'To do' : 'Done'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="app-full-task-list">
                {visibleTasks.length ? (
                  visibleTasks.map(taskRow)
                ) : (
                  <p className="app-list-empty">No steps in this view yet.</p>
                )}
              </div>
              <form className="app-add-form" onSubmit={addCustomTask}>
                <label htmlFor="new-task">
                  Add your own step{' '}
                  <span lang="ar" dir="rtl">
                    أضف خطوة
                  </span>
                </label>
                <div>
                  <input
                    id="new-task"
                    value={newTask}
                    onChange={(event) => setNewTask(event.target.value)}
                    maxLength={90}
                    placeholder="e.g. Call my new school"
                  />
                  <button type="submit">
                    <Plus size={17} /> Add step
                  </button>
                </div>
              </form>
            </section>
          )}

          {view === 'documents' && (
            <section className="app-view-section" aria-labelledby="documents-title">
              <div className="app-page-heading">
                <div>
                  <span className="app-kicker">
                    KEEP IT TOGETHER{' '}
                    <span lang="ar" dir="rtl">
                      مستنداتك
                    </span>
                  </span>
                  <h1 id="documents-title">Documents</h1>
                  <p>
                    Track the names of the documents you have ready. No files are uploaded or
                    shared.
                  </p>
                </div>
                <FileText className="app-heading-icon" size={42} strokeWidth={1.2} />
              </div>
              <div className="app-document-layout">
                <div className="app-document-main">
                  <form
                    className="app-add-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addDocument(newDocument);
                    }}
                  >
                    <label htmlFor="new-document">
                      Track a document{' '}
                      <span lang="ar" dir="rtl">
                        أضف مستنداً
                      </span>
                    </label>
                    <div>
                      <input
                        id="new-document"
                        value={newDocument}
                        onChange={(event) => setNewDocument(event.target.value)}
                        maxLength={80}
                        placeholder="Document name"
                      />
                      <button type="submit">
                        <Plus size={17} /> Add
                      </button>
                    </div>
                  </form>
                  <div className="app-document-list">
                    <div className="app-panel-heading">
                      <div>
                        <span className="app-kicker">YOUR LIST</span>
                        <h2>Ready to hand</h2>
                      </div>
                      <span className="app-count-pill">{documents.length} tracked</span>
                    </div>
                    {documents.length ? (
                      <ul>
                        {documents.map((name, index) => (
                          <li key={name}>
                            <span className="app-list-number">{arabicIndex(index)}</span>
                            <FileText size={18} />
                            <strong>{name}</strong>
                            <button
                              type="button"
                              onClick={() =>
                                setDocuments((previous) => previous.filter((item) => item !== name))
                              }
                              aria-label={'Remove ' + name}
                            >
                              <Trash2 size={17} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="app-empty">
                        <FileText size={27} />
                        <h3>Start with one document.</h3>
                        <p>Add a name so you can keep track of what is ready.</p>
                      </div>
                    )}
                  </div>
                </div>
                <aside className="app-suggestions">
                  <span className="app-kicker">COMMON STARTING POINTS</span>
                  <h2>Useful to check</h2>
                  <p>
                    These are examples, not a universal requirement list. Ask your employer or
                    chosen provider what applies.
                  </p>
                  {suggestedDocuments.map((name) => (
                    <button
                      type="button"
                      key={name}
                      disabled={hasDocument(name)}
                      onClick={() => addDocument(name)}
                    >
                      <span>{name}</span>
                      {hasDocument(name) ? <Check size={17} /> : <Plus size={17} />}
                    </button>
                  ))}
                </aside>
              </div>
            </section>
          )}

          {view === 'places' && (
            <section className="app-view-section" aria-labelledby="places-title">
              <div className="app-page-heading">
                <div>
                  <span className="app-kicker">
                    EXPLORE ABU DHABI{' '}
                    <span lang="ar" dir="rtl">
                      اكتشف أبوظبي
                    </span>
                  </span>
                  <h1 id="places-title">Places to know</h1>
                  <p>Save a few places you would like to explore as you settle in.</p>
                </div>
                <span className="app-count-pill">{savedPlaces.length} saved</span>
              </div>
              <div className="app-place-grid">
                {places.map((place) => {
                  const saved = savedPlaces.includes(place.id);
                  return (
                    <article className="app-place-card" key={place.id}>
                      <div className="app-place-image">
                        <Image
                          src={place.image}
                          alt={'Illustrative scene of ' + place.title + ' in Abu Dhabi'}
                          fill
                          sizes="(max-width: 700px) 100vw, 33vw"
                        />
                      </div>
                      <div className="app-place-body">
                        <span className="app-kicker">{place.type}</span>
                        <h2>{place.title}</h2>
                        <p>{place.detail}</p>
                        <button
                          type="button"
                          className={saved ? 'is-saved' : ''}
                          aria-pressed={saved}
                          onClick={() => togglePlace(place.id)}
                        >
                          {saved ? <Check size={17} /> : <Plus size={17} />}
                          {saved ? 'Saved' : 'Save place'}{' '}
                          <span lang="ar" dir="rtl">
                            {saved ? 'محفوظ' : 'حفظ المكان'}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="app-image-note">
                Images are illustrative and inspired by Abu Dhabi. Saved places stay on this device.
              </p>
            </section>
          )}
        </main>
      </div>
      {activeTask && (
        <div className="app-modal-backdrop" onClick={() => setActiveTaskId(null)}>
          <section
            ref={dialogRef}
            className="app-task-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-dialog-top">
              <span className="app-kicker">
                YOUR NEXT ACTION{' '}
                <span lang="ar" dir="rtl">
                  خطوتك التالية
                </span>
              </span>
              <button
                ref={dialogCloseButtonRef}
                type="button"
                aria-label="Close step"
                onClick={() => setActiveTaskId(null)}
              >
                <X size={21} />
              </button>
            </div>
            <div className="app-dialog-content">
              <span className="app-task-phase">
                {activeTask.phase} · {activeTask.owner}
              </span>
              <h2 id="dialog-title">{activeTask.title}</h2>
              <p>{activeTask.summary}</p>
              <h3>
                A simple checklist{' '}
                <span lang="ar" dir="rtl">
                  قائمة بسيطة
                </span>
              </h3>
              {activeTask.checklist.length ? (
                <div className="app-checklist">
                  {activeTask.checklist.map((item) => {
                    const key = activeTask.id + '::' + item;
                    const checked = checkedItems.includes(key);
                    return (
                      <button
                        type="button"
                        key={key}
                        aria-pressed={checked}
                        className={checked ? 'is-checked' : ''}
                        onClick={() => toggleCheck(key)}
                      >
                        <span className="app-small-check">{checked && <Check size={14} />}</span>
                        {item}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="app-custom-hint">
                  Use the note below to record what this step needs.
                </p>
              )}
              <label className="app-note-label" htmlFor="task-note">
                A note for yourself{' '}
                <span lang="ar" dir="rtl">
                  ملاحظة لك
                </span>
              </label>
              <textarea
                id="task-note"
                rows={3}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                maxLength={500}
                placeholder="What should you remember?"
              />
              <button
                type="button"
                className="app-save-note"
                onClick={() =>
                  setNotes((previous) => ({ ...previous, [activeTask.id]: noteDraft }))
                }
              >
                Save note <Check size={16} />
              </button>
            </div>
            <div className="app-dialog-footer">
              <span>Saved on this device · No application is submitted</span>
              <button
                type="button"
                className="app-primary-button"
                onClick={() => toggleCompleted(activeTask.id)}
              >
                {completed.includes(activeTask.id) ? 'Mark to do' : 'Mark done'}{' '}
                <span lang="ar" dir="rtl">
                  {completed.includes(activeTask.id) ? 'قيد التنفيذ' : 'تحديد كمكتملة'}
                </span>
                <Check size={17} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
