import { launchBrowser, sleep } from './lib/browser.mjs';

const tokens = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = tokens.indexOf(`--${name}`);
  return index < 0 ? fallback : tokens[index + 1];
};
const base = argument('base', 'http://127.0.0.1:3000').replace(/\/$/, '');
const budgetMs = Number(argument('budget', '15000'));
const mutate = tokens.includes('--mutate');
const checkReset = tokens.includes('--check-reset');
const probe = argument('probe', '');

if (tokens.includes('--help')) {
  console.log(
    'node scripts/dashboard-check.mjs [--base URL] [--budget 15000] [--mutate] [--check-reset]',
  );
  console.log('Default: read-only filter, populated-state, mobile and Arabic/dark checks.');
  console.log(
    '--mutate creates isolated QA demo records and exercises review decisions without a reset.',
  );
  console.log(
    '--check-reset explicitly resets the whole demo at the end; reserved for coordinated final QA.',
  );
  process.exit(0);
}

function check(label, passed) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`);
  if (!passed) throw new Error(label);
}

async function state() {
  const response = await fetch(`${base}/api/state`);
  if (!response.ok) throw new Error(`State request failed (${response.status})`);
  return (await response.json()).state;
}

async function action(body) {
  const response = await fetch(`${base}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${body.type}: ${payload.error ?? response.status}`);
  return payload.state;
}

async function until(label, predicate) {
  const started = performance.now();
  while (performance.now() - started < budgetMs) {
    if (await predicate()) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
}

const visible = `(element) => element.getClientRects().length > 0`;

async function navigate(page, path) {
  await page.navigate(`${base}${path}`);
  await until(`${path} rendered`, () =>
    page.evaluate(
      `Boolean(document.querySelector('main h1')) && !document.body.innerText.includes('Internal Server Error')`,
    ),
  );
  await sleep(350);
}

async function click(page, label) {
  await until(`button ${label}`, () =>
    page.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((element) =>
      (${visible})(element) && element.textContent.trim() === ${JSON.stringify(label)} && !element.disabled);
    if (!button) return false;
    button.click();
    return true;
  })()`),
  );
}

async function fill(page, selector, value) {
  await until(`control ${selector}`, () =>
    page.evaluate(`(() => {
    const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find(${visible});
    if (!element) return false;
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype :
      element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`),
  );
}

async function fillLabel(page, label, value) {
  await until(`field ${label}`, () =>
    page.evaluate(`(() => {
    const wrapper = [...document.querySelectorAll('label')].find((element) =>
      (${visible})(element) && element.textContent.trim().includes(${JSON.stringify(label)}));
    const element = wrapper?.querySelector('input,select,textarea');
    if (!element) return false;
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype :
      element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`),
  );
}

async function contains(page, text) {
  return page.evaluate(
    `document.querySelector('main')?.innerText.includes(${JSON.stringify(text)}) ?? false`,
  );
}

async function filter(page, path, searchLabel, populated, empty) {
  await navigate(page, path);
  check(`${path} uses populated shared records`, await contains(page, populated));
  await fillLabel(page, searchLabel, 'qa-no-matching-record-9ad876e');
  await until(`${path} filtered empty`, () => contains(page, empty));
  check(`${path} distinguishes filtered empty`, true);
  await click(page, 'Clear filters');
  await until(`${path} clear filters`, () => contains(page, populated));
  check(`${path} clear filters restores rows`, true);
}

const browser = await launchBrowser();
const pages = [];
try {
  const page = await browser.firstPage();
  pages.push(page);
  await page.send('Network.enable');
  await page.send('Network.setCookie', {
    name: 'rasikh-locale',
    value: 'en',
    url: base,
    path: '/',
  });
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    localStorage.setItem('rasikh-theme', 'light');
    window.__qaErrors = [];
    addEventListener('error', (event) => window.__qaErrors.push(event.message));
    addEventListener('unhandledrejection', () => window.__qaErrors.push('Unhandled promise rejection'));
  `,
  });

  if (probe) {
    await navigate(page, probe);
    await sleep(1500);
    console.log(
      await page.evaluate(`JSON.stringify({
      headings: [...document.querySelectorAll('main h1')].map(element => element.textContent.trim()),
      buttons: [...document.querySelectorAll('button')].filter(${visible}).map(element => ({ label: element.textContent.trim(), disabled: element.disabled })),
      errors: window.__qaErrors,
      statuses: [...document.querySelectorAll('[role="status"],[role="alert"]')].map(element => element.textContent.trim())
    })`),
    );
    if (tokens.includes('--bank-flow')) {
      const applicationId = probe.split('/').at(-1);
      const before = await state();
      const application = before.applications[applicationId];
      if (!before.hires[application?.hireId]?.fullName.startsWith('QA dashboard')) {
        throw new Error('Bank probe mutations require an isolated QA dashboard record');
      }
      const observer = await browser.newPage();
      pages.push(observer);
      await navigate(observer, `/employer/hires/${application.hireId}`);
      if (application.state === 'submitted') await click(page, 'Start review');
      await click(page, 'Request information');
      const written = 'QA bank follow-up recorded locally without an external message.';
      await fill(page, 'dialog[open] textarea, [role="dialog"] textarea', written);
      await page.evaluate(
        `document.querySelector('dialog[open] input[type="checkbox"], [role="dialog"] input[type="checkbox"]').click()`,
      );
      await click(page, 'Record request');
      await until(
        'bank probe information request',
        async () => (await state()).applications[applicationId].state === 'needs_info',
      );
      await until('bank probe shared reason', () => contains(observer, written));
      check('bank information request propagates to employer', true);
      await click(page, 'Approve application');
      await page.evaluate(
        `document.querySelector('dialog[open] input[type="checkbox"], [role="dialog"] input[type="checkbox"]').click()`,
      );
      await click(page, 'Record approval');
      await until(
        'bank probe approved',
        async () => (await state()).applications[applicationId].state === 'approved',
      );
      const step = (await state()).steps[`step_${application.hireId}_bank_account`];
      check(
        'bank approval completes step and clears obsolete blockers',
        step.status === 'done' && !step.blockedReason && !step.waitingOn,
      );
    }
    process.exitCode = 0;
  } else {
    await filter(
      page,
      '/employer/hires',
      'Search hires',
      'Samuel Okoye',
      'No journeys match these filters',
    );
    await filter(
      page,
      '/landlord/applications',
      'Search applications',
      'Olga Petrova',
      'No matching applications',
    );
    await filter(
      page,
      '/bank/applications',
      'Search applications',
      'Mei Lin Tan',
      'No matching applications',
    );
    await navigate(page, '/employer/expansion');
    check(
      'expansion has a populated company',
      await page.evaluate(
        `document.querySelector('select[aria-label="Expansion company"]')?.value === 'company_seed_gulf_meridian'`,
      ),
    );
    await navigate(page, '/employer/expansion/team');
    check('expansion team uses populated shared members', await contains(page, 'Eleanor Brooks'));

    if (mutate) {
      const marker = `QA dashboard ${Date.now()}`;
      await navigate(page, '/employer/hires');
      await click(page, 'Add a hire');
      await click(page, 'Use sample');
      await fillLabel(page, 'Full name', marker);
      await click(page, 'Create roadmap');
      let current;
      let hire;
      await until('isolated hire created', async () => {
        current = await state();
        hire = Object.values(current.hires).find((candidate) => candidate.fullName === marker);
        return Boolean(hire);
      });
      await until('exact created hire navigation', () =>
        page.evaluate(`location.pathname === ${JSON.stringify(`/employer/hires/${hire.id}`)}`),
      );
      check('create hire navigates to its own stable id', true);

      for (const kind of ['passport', 'offer_letter', 'degree']) {
        current = await action({
          type: 'document.add',
          hireId: hire.id,
          kind,
          source: 'demo',
          fileName: `qa-${kind}.pdf`,
          labels: kind === 'offer_letter' ? ['employment', 'salary'] : [kind],
          fields: [{ key: 'name', label: 'Full name', value: marker, confidence: 0.9 }],
          status: 'extracted',
          reasoning: 'Illustrative QA fields prepared locally. No uploaded file was extracted.',
        });
        current = await action({
          type: 'document.review',
          hireId: hire.id,
          documentId: `doc_${kind}_${hire.id}`,
          fields: [{ key: 'name', label: 'Full name', value: marker, confidence: null }],
          accept: true,
        });
      }
      current = await action({
        type: 'step.set_status',
        stepId: `step_${hire.id}_residence_visa`,
        status: 'done',
      });
      current = await action({
        type: 'step.set_status',
        stepId: `step_${hire.id}_emirates_id`,
        status: 'waiting',
        waitingOn: 'An illustrative demo authority record',
      });
      const propertyId = `prop_qa_${Date.now()}`;
      current = await action({
        type: 'property.create',
        id: propertyId,
        landlordId: 'landlord_al_reem',
        property: {
          name: marker,
          unit: 'QA1',
          area: 'Al Reem Island',
          bedrooms: 1,
          leaseRef: `lease_${propertyId}`,
          estAnnualRentAed: 74_000,
          chequeOptions: [2, 4],
        },
      });
      const applicationIds = {};
      for (const kind of ['rental', 'bank_account']) {
        current = await action({
          type: 'application.create',
          application: {
            hireId: hire.id,
            kind,
            partyId: kind === 'rental' ? 'landlord_al_reem' : 'bank_saadiyat',
            ...(kind === 'rental' ? { propertyId } : {}),
            employerBacked: true,
            disclosed: [{ label: 'employment', derived: false }],
            risk: {
              level: 'moderate',
              headline: 'Illustrative QA review, not a credit assessment.',
              generatedBy: 'demo',
              points: [
                {
                  label: 'Demo evidence',
                  effect: 'neutral',
                  reason: 'This isolated record exercises the local review workflow.',
                },
              ],
            },
          },
          approval: {
            title: `Review the ${kind} demo draft`,
            detail: 'Isolated local QA application, with no external send.',
            stepId: `step_${hire.id}_${kind === 'rental' ? 'housing' : 'bank_account'}`,
          },
        });
        const application = Object.values(current.applications).find(
          (candidate) => candidate.hireId === hire.id && candidate.kind === kind,
        );
        applicationIds[kind] = application.id;
        const approval = Object.values(current.approvals).find(
          (candidate) =>
            candidate.applicationId === application.id && candidate.status === 'pending',
        );
        current = await action({
          type: 'approval.decide',
          approvalId: approval.id,
          hireId: hire.id,
          approve: true,
        });
      }

      const employer = await browser.newPage();
      pages.push(employer);
      await navigate(employer, `/employer/hires/${hire.id}`);
      const rentalId = applicationIds.rental;
      await navigate(page, `/landlord/applications/${rentalId}`);
      await click(page, 'Start review');
      await fillLabel(page, 'Outcome', 'info_requested');
      const rentalNote = 'QA landlord information request recorded locally.';
      await fill(page, 'form textarea', rentalNote);
      await click(page, 'Save information request');
      await until(
        'rental information request stored',
        async () => (await state()).applications[rentalId].state === 'needs_info',
      );
      await until('employer receives landlord reason', () => contains(employer, rentalNote));
      check('landlord request information updates employer through live state', true);
      await click(page, 'Resume review');
      await fillLabel(page, 'Outcome', 'approved');
      await fill(
        page,
        'form textarea',
        'QA rental approval, recorded locally without an external send.',
      );
      await click(page, 'Save approval');
      await until(
        'rental approved',
        async () => (await state()).applications[rentalId].state === 'approved',
      );
      check(
        'landlord approval completes the shared housing step',
        (await state()).steps[`step_${hire.id}_housing`].status === 'done',
      );

      const bankId = applicationIds.bank_account;
      const bankPage = await browser.newPage();
      pages.push(bankPage);
      await navigate(bankPage, `/bank/applications/${bankId}`);
      await click(bankPage, 'Start review');
      await click(bankPage, 'Request information');
      await fill(
        bankPage,
        'dialog[open] textarea, [role="dialog"] textarea',
        'QA bank follow-up, recorded locally.',
      );
      await bankPage.evaluate(
        `document.querySelector('dialog[open] input[type="checkbox"], [role="dialog"] input[type="checkbox"]').click()`,
      );
      await click(bankPage, 'Record request');
      await until(
        'bank information request stored',
        async () => (await state()).applications[bankId].state === 'needs_info',
      );
      check('bank request information remains in shared history', true);
      await click(bankPage, 'Approve application');
      await bankPage.evaluate(
        `document.querySelector('dialog[open] input[type="checkbox"], [role="dialog"] input[type="checkbox"]').click()`,
      );
      await click(bankPage, 'Record approval');
      await until(
        'bank approved',
        async () => (await state()).applications[bankId].state === 'approved',
      );
      const bankStep = (await state()).steps[`step_${hire.id}_bank_account`];
      check(
        'bank approval clears stale blockers',
        bankStep.status === 'done' && !bankStep.blockedReason && !bankStep.waitingOn,
      );
      console.log(
        `QA records retained for review: ${hire.id}, ${propertyId}, ${rentalId}, ${bankId}`,
      );
    }

    await page.send('Network.setCookie', {
      name: 'rasikh-locale',
      value: 'ar',
      url: base,
      path: '/',
    });
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('rasikh-theme', 'dark');`,
    });
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    for (const path of [
      '/employer/hires',
      '/employer/expansion',
      '/employer/expansion/team',
      '/landlord/applications',
      '/bank/applications',
    ]) {
      await navigate(page, path);
      check(
        `${path} renders Arabic RTL and dark mode`,
        await page.evaluate(
          `document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl' && document.documentElement.classList.contains('dark')`,
        ),
      );
      check(
        `${path} contains horizontal layout at mobile width`,
        await page.evaluate(`document.documentElement.scrollWidth <= innerWidth + 2`),
      );
      check(
        `${path} has no uncaught page errors`,
        await page.evaluate(`window.__qaErrors.length === 0`),
      );
    }

    if (checkReset) {
      const before = await state();
      const response = await fetch(`${base}/api/reset`, { method: 'POST' });
      check('coordinated reset succeeds', response.ok);
      const after = (await response.json()).state;
      check(
        'reset restores seed and keeps revision rising',
        after.rev > before.rev &&
          Object.keys(after.hires).length === 9 &&
          Object.keys(after.companies).includes('company_seed_gulf_meridian'),
      );
      await until('reset reaches the open dashboard', () => contains(page, 'Mei Lin Tan'));
      check('reset propagates to connected dashboard', true);
    }
  }
} catch (error) {
  console.error(error.message);
  for (const page of pages) {
    try {
      console.error(
        await page.evaluate(`JSON.stringify({ path: location.pathname,
        buttons: [...document.querySelectorAll('button')].filter(${visible}).map(element => ({label: element.textContent.trim(),disabled:element.disabled})),
        errors: window.__qaErrors ?? [] })`),
      );
    } catch {}
  }
  process.exitCode = 1;
} finally {
  for (const page of pages) page.close();
  browser.close();
}
