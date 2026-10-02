"""Build the explicitly fictional Maya Khalil authoring pack. No app data is modified."""
from pathlib import Path
from xml.sax.saxutils import escape
import json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parent
PDF_DIR = ROOT / 'output' / 'pdf'
DOC_DIR = ROOT / 'documents'
PDF_DIR.mkdir(parents=True, exist_ok=True)
DOC_DIR.mkdir(parents=True, exist_ok=True)

CASE = 'hire_demo_maya_001'
NAME = 'Maya Khalil'
EMPLOYER = 'Demo Harbor AI'
NOTICE = 'FAKE / FICTIONAL DEMO - NO OFFICIAL VALIDITY'
PROFILE = {
    'synthetic': True,
    'purpose': 'Standalone authoring metadata, not an app import or replacement of existing fixtures.',
    'notice': NOTICE,
    'case_id': CASE,
    'snapshot_date': '2026-10-02',
    'person': {'full_name': NAME, 'date_of_birth': '1996-04-16', 'nationality': 'Jordanian',
               'current_city': 'Amman, Jordan', 'destination': 'Abu Dhabi, UAE',
               'email': 'maya.khalil@example.com', 'passport_number': 'FAKE-P-MAYA-001',
               'passport_expiry_date': '2032-06-01'},
    'employment': {'employer': EMPLOYER, 'employer_is_fictional': True,
                   'role': 'Machine Learning Engineer', 'offered_monthly_salary_aed': 18000,
                   'start_date': '2026-11-01', 'offer_date': '2026-09-15',
                   'accepted_date': '2026-09-18', 'projected_income_not_payroll': True},
    'relocation': {'planned_arrival': '2026-10-18', 'temporary_housing_nights': 14,
                   'temporary_housing_from': '2026-10-18', 'temporary_housing_checkout': '2026-11-01',
                   'one_time_allowance_aed': 10000, 'allowance_status': 'Promised, not paid',
                   'residence_and_emirates_id_status': 'Pending; no official status asserted',
                   'local_bank_account_status': 'Not opened; draft only'},
    'housing': {'listing_id': 'lease_demo_maya_reem_2207', 'building': 'Demo Haven Tower (fictional)',
                'unit': '2207', 'area': 'Al Reem Island, Abu Dhabi', 'bedrooms': 1,
                'requested_move_in': '2026-11-01', 'annual_rent_aed': 84000,
                'monthly_rent_equivalent_aed': 7000, 'requested_instalments': 4,
                'instalment_amount_aed': 21000, 'monthly_budget_ceiling_aed': 8000,
                'landlord_decision': 'Pending; terms are a request, not an approved lease'},
    'savings': {'issuer': 'Demo Meridian Bank (fictional, outside UAE)',
                'account_identifier': 'FAKE-ACCT-MAYA-001',
                'currency_note': 'Illustrative AED equivalents, no real account or exchange rate',
                'opening_balance_aed_equivalent': 48000,
                'closing_balance_aed_equivalent': 52000},
    'degree': {'institution': 'Demo Cedar Institute of Technology (fictional)',
               'degree_title': 'BSc Computer Science', 'award_date': '2018-06-30'},
    'privacy_demo': {'raw_salary_to_landlord': 'Denied by demo policy, even with consent',
                     'raw_bank_balance_to_landlord': 'Denied by demo policy',
                     'newcomer_approved_landlord_packet': ['name', 'role', 'employer relocation support',
                                                  'housing request', 'derived budget-fit result'],
                     'passport_to_landlord': 'Not shared; would need separate scoped consent',
                     'passport_to_bank': 'Not shared; would need separate scoped consent',
                     'budget_fit': 'Illustrative: requested rent is within stated housing budget',
                     'real_partner_verification': False},
}

DOCUMENTS = [
    {'slug': '01-passport-specimen', 'title': 'Passport details', 'eyebrow': 'IDENTITY / TRAINING SPECIMEN',
     'subtitle': 'A fictional identity record for document extraction. Not a government-issued passport.',
     'id': 'doc_passport_demo_maya_001', 'kind': 'passport', 'tags': ['identity'],
     'status': 'INVALID FOR TRAVEL OR IDENTITY CHECKS',
     'fields': [('Full name', NAME), ('Passport number', 'FAKE-P-MAYA-001'),
                ('Nationality', 'Jordanian'), ('Date of birth', '1996-04-16'),
                ('Expiry date', '2032-06-01'), ('Issue date', '2022-06-02')],
     'expected': {'full_name': NAME, 'passport_number': 'FAKE-P-MAYA-001',
                  'nationality': 'Jordanian', 'date_of_birth': '1996-04-16', 'expiry_date': '2032-06-01'},
     'notes': [('What the demo shows', 'Extract these five core fields, show their source text, and ask Maya to confirm them. Parsing does not authenticate a document.'),
               ('Sharing boundary', 'Keep the raw identity document private by default. Any landlord or bank disclosure needs its own destination-specific consent.'),
               ('Visible fabrication', 'This page deliberately has no national crest, official seal, photo, MRZ, barcode or signature. The passport identifier is invalid.')],
     'recipient': 'Private newcomer workspace; no external sharing granted'},
    {'slug': '02-employment-offer', 'title': 'Employment offer', 'eyebrow': 'EMPLOYMENT / FICTIONAL OFFER',
     'subtitle': 'Issued by Demo Harbor AI, an imaginary employer used only in the Rasikh demo.',
     'id': 'doc_offer_demo_maya_001', 'kind': 'offer_letter', 'tags': ['employment', 'salary'],
     'status': 'FICTIONAL OFFER - PROJECTED INCOME ONLY',
     'fields': [('Employee', NAME), ('Employer', EMPLOYER), ('Role', 'Machine Learning Engineer'),
                ('Work location', 'Abu Dhabi, UAE'), ('Start date', '2026-11-01'),
                ('Monthly base salary', 'AED 18,000'), ('Offer date', '2026-09-15'), ('Accepted date', '2026-09-18')],
     'notes': [('Offer narrative', 'In this invented story, Maya accepts a full-time engineering role. The employer plans to coordinate her work and residence process through its HR team. The start remains subject to the applicable onboarding checks.'),
               ('Relocation support', 'This private offer also promises 14 nights of temporary housing and a one-time AED 10,000 relocation allowance. That allowance is not recurring salary and has not been paid. The separate shareable support letter omits the allowance amount.'),
               ('Private salary evidence', 'Maya has not started this role, so this is an offer, not a payslip or proof of received salary. Do not send this mixed employment-and-salary document to the landlord.')],
     'recipient': 'Private newcomer workspace and fictional employer only'},
    {'slug': '03-prior-bank-statement', 'title': 'Prior-bank statement', 'eyebrow': 'FINANCIAL / SYNTHETIC STATEMENT',
     'subtitle': 'Demo Meridian Bank is imaginary. This is a mock prior account outside the UAE.',
     'id': 'doc_bank_demo_maya_001', 'kind': 'bank_statement', 'tags': ['financial', 'prior_bank'],
     'status': 'NO REAL ACCOUNT - ILLUSTRATIVE AED EQUIVALENTS',
     'fields': [('Account holder', NAME), ('Account identifier', 'FAKE-ACCT-MAYA-001'),
                ('Statement period', '2026-09-01 to 2026-09-30'), ('Closing balance', 'AED 52,000')],
     'table': {'headers': ['Date', 'Invented activity', 'Change (AED equiv.)', 'Balance (AED equiv.)'],
               'rows': [['2026-09-01', 'Opening balance', '-', '48,000'],
                        ['2026-09-02', 'Transfer in from savings', '+8,000', '56,000'],
                        ['2026-09-09', 'Living expenses', '-3,500', '52,500'],
                        ['2026-09-21', 'Travel preparation', '-500', '52,000']]},
     'expected': {'account_holder': NAME, 'closing_balance_aed': 52000},
     'notes': [('Currency and authenticity', 'Every figure is an invented AED equivalent for simple demo arithmetic. No real foreign-currency statement, conversion rate, bank account, IBAN or financial verification is represented.'),
               ('Sharing boundary', 'Keep this statement out of the landlord packet. A future bank application is a separate, consented flow; this pack records no bank submission or approval.')],
     'recipient': 'Private newcomer workspace; bank sharing not yet authorised'},
    {'slug': '04-degree-record', 'title': 'Degree record', 'eyebrow': 'EDUCATION / FICTIONAL RECORD',
     'subtitle': 'Demo Cedar Institute of Technology is an imaginary institution.',
     'id': 'doc_degree_demo_maya_001', 'kind': 'degree', 'tags': ['education'],
     'status': 'NOT AN ACCREDITED OR ATTESTED CERTIFICATE',
     'fields': [('Holder name', NAME), ('Institution', 'Demo Cedar Institute of Technology'),
                ('Degree title', 'BSc Computer Science'), ('Award date', '2018-06-30'),
                ('Record number', 'FAKE-DEG-MAYA-001'), ('Issuer location', 'Amman, Jordan (story setting)')],
     'expected': {'holder_name': NAME, 'institution': 'Demo Cedar Institute of Technology',
                  'degree_title': 'BSc Computer Science'},
     'notes': [('Character background', 'Maya has eight years of imagined software and machine-learning experience. This record makes her engineering offer coherent and gives the demo an additional reusable document.'),
               ('What the demo shows', 'Extract the holder, institution and degree title; then ask the newcomer to confirm the text. Any real qualification verification or attestation would be a separate process.'),
               ('Visible fabrication', 'No university seal, registrar signature, official accreditation claim or attestation mark appears on this page.')],
     'recipient': 'Private newcomer workspace; fictional employer review only'},
    {'slug': '05-employer-support', 'title': 'Employer relocation support', 'eyebrow': 'EMPLOYER / NON-FINANCIAL SUPPORT PACKET',
     'subtitle': 'A shareable fictional HR statement that deliberately excludes Maya\'s salary.',
     'id': 'doc_support_demo_maya_001', 'kind': 'employer_support', 'tags': ['employment'],
     'status': 'FICTIONAL HR SUPPORT - NOT A RENT GUARANTEE',
     'fields': [('Employee', NAME), ('Employer', EMPLOYER), ('Role', 'Machine Learning Engineer'),
                ('Planned start date', '2026-11-01'), ('Planned arrival', '2026-10-18'),
                ('Support reference', 'FAKE-SUPPORT-MAYA-001')],
     'notes': [('Support in this story', 'Demo Harbor AI plans to coordinate onboarding and the work/residence process, provide 14 nights of temporary housing from 18 October (checkout 1 November), and help Maya gather the chosen providers\' required documents.'),
               ('Scope of employer backing', 'HR confirms the invented offer and planned start. This letter is not a rent guarantee, a co-signed lease, bank approval, official immigration status, or proof that Maya has begun work.'),
               ('Salary removed', 'Monthly salary, bank balance and the amount of the private relocation allowance are absent. The full offer stays private; this separate statement is the employer evidence in the landlord packet.')],
     'recipient': 'Demo Haven Rentals, for the single housing request only'},
    {'slug': '06-housing-request', 'title': 'Housing request', 'eyebrow': 'HOUSING / APPLICATION DRAFT',
     'subtitle': 'Demo Haven Rentals and Demo Haven Tower are imaginary. The location is a real area.',
     'id': 'doc_housing_demo_maya_001', 'kind': 'housing_request', 'tags': ['housing'],
     'status': 'PENDING LANDLORD REVIEW - NOT A LEASE',
     'fields': [('Applicant', NAME), ('Area', 'Al Reem Island, Abu Dhabi'),
                ('Fictional property', 'Demo Haven Tower / Unit 2207'), ('Bedrooms', '1'),
                ('Requested move-in', '2026-11-01'), ('Proposed annual rent', 'AED 84,000'),
                ('Requested payment terms', '4 instalments of AED 21,000'), ('Listing reference', 'lease_demo_maya_reem_2207')],
     'notes': [('Why this home', 'Maya wants her own home after employer-provided temporary housing ends. She prefers a one-bedroom apartment and needs the landlord to review her request while HR coordinates the move.'),
               ('Terms still to agree', 'Four instalments are Maya\'s request. Payment method, deposit, fees, required documents, lease eligibility and registration steps must be confirmed with the chosen landlord. No payment or signature is represented.'),
               ('Minimal application packet', 'Share her name, this request, the employer support statement and the separately created budget-fit signal after Maya approves this exact packet. The landlord keeps the final decision.')],
     'recipient': 'Demo Haven Rentals; simulated handoff after Maya approval'},
    {'slug': '07-landlord-summary-and-consent', 'title': 'Landlord summary & consent', 'eyebrow': 'PRIVACY / MINIMAL DISCLOSURE',
     'subtitle': 'A new derived summary, separate from the raw offer and bank statement.',
     'id': 'doc_summary_demo_maya_001', 'kind': 'derived_housing_summary',
     'tags': ['employment', 'housing', 'budget_fit', 'simulated_consent'],
     'status': 'SIMULATED CONSENT RECEIPT - NO EXTERNAL DISCLOSURE',
     'fields': [('Applicant', NAME), ('Employer / role', 'Demo Harbor AI / ML Engineer'),
                ('Proposed rent', 'AED 84,000 per year'), ('Requested terms', '4 instalments'),
                ('Budget-fit result', 'Within stated housing budget'), ('Partner decision', 'Pending landlord review')],
     'notes': [('Limited meaning of the result', 'The invented rent fits Maya\'s stated housing budget. This is a demo calculation, not a verified income assessment, credit score, ability-to-pay guarantee or partner recommendation. Her proposed job has not started.'),
               ('Simulated approval record', 'On 2 October 2026, Maya is scripted to approve her name, housing request, employer support and this derived result for Demo Haven Rentals, for this one housing review. This receipt records a fictional scene; no real consent or transmission occurred.'),
               ('Excluded from this packet', 'Raw salary, full offer, raw savings figures, bank statement, passport number and passport image. The demo policy denies raw salary and raw bank data to the landlord; additional consent does not bypass that denial.'),
               ('Destination scope', 'No bank sharing is authorised by this housing approval. Any future identity or bank packet needs its own checks and consent. The landlord may request more information and decides whether to accept the packet.')],
     'recipient': 'Demo Haven Rentals only; one fictional housing review'},
]

W, H = A4
INK, MUTED, TEAL, ORANGE, LIGHT = map(HexColor, ['#173531', '#61746F', '#087D72', '#C54B20', '#F0F5F2'])
MARGIN = 42
CONTENT = W - MARGIN * 2
c = canvas.Canvas(str(PDF_DIR / 'maya-khalil-demo-pack.pdf'), pagesize=A4)
c.setTitle('FAKE / FICTIONAL DEMO - Maya Khalil - Rasikh')
c.setAuthor('Rasikh demo authoring pack')
c.setSubject('Entirely fictional character and seven synthetic supporting documents; no official validity')

def para(text, x, top, width=CONTENT, size=10.5, leading=15, color=INK, bold=False):
    style = ParagraphStyle('p', fontName='Helvetica-Bold' if bold else 'Helvetica', fontSize=size,
                           leading=leading, textColor=color, spaceAfter=0)
    p = Paragraph(escape(text), style)
    _, ph = p.wrap(width, 700)
    p.drawOn(c, x, top-ph)
    return top-ph

def line(text, x, y, size=10, bold=False, color=INK):
    c.setFillColor(color)
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    c.drawString(x, y, text)

def base(page, section):
    c.setFillColor(HexColor('#FCFDFC'))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, H-34, W, 34, fill=1, stroke=0)
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('Helvetica-Bold', 10)
    c.drawCentredString(W/2, H-22, NOTICE)
    c.saveState()
    c.translate(W/2, H/2)
    c.rotate(30)
    c.setFillColor(HexColor('#EAF0EC'))
    c.setFont('Helvetica-Bold', 67)
    c.drawCentredString(0, -10, 'FAKE DEMO')
    c.restoreState()
    line('rasikh', MARGIN, H-62, 19, True, TEAL)
    line('/ DEMO LAB', MARGIN+62, H-62, 8.5, True, MUTED)
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 8)
    c.drawRightString(W-MARGIN, H-60, section)
    c.setStrokeColor(HexColor('#C7D7CF'))
    c.line(MARGIN, 53, W-MARGIN, 53)
    line('All people, issuers, identifiers, amounts and case events are invented.', MARGIN, 39, 8, color=MUTED)
    line('No official validity. Real places are used only as story settings.', MARGIN, 27, 8, color=MUTED)
    c.setFont('Helvetica-Bold', 9)
    c.drawRightString(W-MARGIN, 28, f'{page:02d} / 09')

def title(eyebrow, heading, subtitle):
    line(eyebrow, MARGIN, H-99, 8.5, True, TEAL)
    y = para(heading, MARGIN, H-113, size=29, leading=34, bold=True)
    return para(subtitle, MARGIN, y-12, size=10.5, color=MUTED)-22

def chip(text, top):
    c.setFillColor(LIGHT)
    c.roundRect(MARGIN, top-32, CONTENT, 32, 6, fill=1, stroke=0)
    line(text, MARGIN+12, top-21, 9, True, TEAL)
    return top-48

def fields(items, top):
    gap, cw = 18, (CONTENT-18)/2
    for n in range(0, len(items), 2):
        pair = items[n:n+2]
        heights = []
        for label, value in pair:
            p = Paragraph(escape(str(value)), ParagraphStyle('v', fontName='Helvetica-Bold', fontSize=12,
                                                           leading=16, textColor=INK))
            heights.append(p.wrap(cw, 100)[1])
        rh = 18+max(heights)+17
        for col, (label, value) in enumerate(pair):
            x = MARGIN+col*(cw+gap)
            line(label.upper(), x, top-9, 8, True, MUTED)
            para(str(value), x, top-19, cw, 12, 16, INK, True)
            c.setStrokeColor(HexColor('#D9E4DE'))
            c.line(x, top-rh+7, x+cw, top-rh+7)
        top -= rh
    return top-13

def note(label, text, top, size=10, gap=19):
    line(label.upper(), MARGIN, top-9, 8.2, True, TEAL)
    return para(text, MARGIN, top-18, size=size, leading=14)-gap

def table(data, top):
    widths = [78, 190, 113, CONTENT-381]
    # Fixed columns; wrapped headings and cells prevent truncation.
    headers, rows = data['headers'], data['rows']
    c.setFillColor(TEAL)
    c.rect(MARGIN, top-39, CONTENT, 39, fill=1, stroke=0)
    x = MARGIN
    for text, width in zip(headers, widths):
        para(text, x+8, top-8, width-16, 8.2, 11, HexColor('#FFFFFF'), True)
        x += width
    top -= 39
    for i, row in enumerate(rows):
        c.setFillColor(LIGHT if i % 2 == 0 else HexColor('#FFFFFF'))
        c.rect(MARGIN, top-32, CONTENT, 32, fill=1, stroke=0)
        x = MARGIN
        for text, width in zip(row, widths):
            para(text, x+8, top-9, width-16, 8.5, 11)
            x += width
        top -= 32
    return top-23

# Page 1: a fictional character, with a human motive and a plausible bounded problem.
base(1, 'CHARACTER / FICTIONAL SCENARIO')
y = title('ONE MOVE. SEVERAL OWNERS.', 'Meet Maya Khalil',
          '30-year-old machine learning engineer, relocating from Amman to Abu Dhabi.')
y = chip('FICTIONAL CHARACTER AND QUOTE - NOT CUSTOMER RESEARCH', y)
y = para('"I have the offer and the documents. I need to know what can happen next, and who actually needs to see my salary."',
         MARGIN, y, size=19, leading=26, bold=True)-24
y = fields([('New role', 'Machine Learning Engineer'), ('Fictional employer', EMPLOYER),
            ('Planned arrival', '18 October 2026'), ('Planned start', '1 November 2026'),
            ('Offered salary / month', 'AED 18,000 (not yet earned)'), ('Private prior savings', 'AED 52,000 (invented equivalent)')], y)
y = note('What she is trying to do', 'Maya is moving alone for her first UAE job. She enjoys weekend photography, wants a calm one-bedroom home, and hopes to focus on work once she arrives. Temporary housing gives her two weeks to settle the housing handoff.', y)
y = note('Why she fits Rasikh', 'HR holds the offer and employer support. Maya holds her identity and prior-bank documents. A landlord must decide on her housing request, and a bank must confirm its own requirements. Rasikh can prepare a shared case, show each owner\'s next action, and ask Maya before disclosing information.', y)
y = note('The demo starting point', 'Offer accepted; arrival planned; no UAE account opened; residence and Emirates ID steps pending. Housing terms are requested, not approved. All external integrations and events are simulated.', y)
assert y > 65, y
c.showPage()

# Page 2: stage directions and explicit technical compatibility limits.
base(2, 'PRESENTER GUIDE / 90-SECOND SCENE')
y = title('SHOW THE HANDOFF AND THE BOUNDARY', 'How to demo Maya',
          'Start with her documents, then move one housing request across the parties.')
y = chip('STORYBOARD - ACTUAL APP COVERAGE VARIES', y)
for label, text in [
    ('0:00-0:15 / Introduce the move', '"Maya has accepted an Abu Dhabi job. HR, housing and banking each need different evidence, and someone must keep the next actions moving." Open the character page.'),
    ('0:15-0:35 / Extract and confirm', 'Use the passport text companion to extract fields. Let Maya confirm the name, nationality and dates. Point to the source text; label the result extracted, not verified.'),
    ('0:35-0:55 / Prepare the request', 'Show the housing request and separate employer support letter. The bank packet remains a draft pending provider requirements and a separate approval.'),
    ('0:55-1:15 / Guard moment', 'Stage the attempted full-offer attachment to the landlord. The demo policy denies its salary label. Maya approves only the new derived budget-fit summary plus the minimal housing packet. Her raw salary and bank figures stay private.'),
    ('1:15-1:30 / Hand off and stop', 'Show "pending landlord review" and HR\'s next action. Say: "Rasikh prepares and coordinates this case; the provider keeps the decision." Any delivery/status changes are mock events.'),
]: y = note(label, text, y, gap=12)
y = note('Internal calculation, not for the landlord', 'Requested rent: AED 84,000 / 12 = AED 7,000 per month. Maya\'s invented housing budget is AED 8,000. The derived result is "within stated housing budget." It is not a credit or verified affordability assessment.', y, 9.5, gap=12)
y = note('Separate agent-runtime branch', 'Passport, bank statement and degree text companions match the separately inspected agent-runtime branch, not the main-branch scaffold. Other documents are storyboard material; offer extraction and image/PDF upload are not claimed. Metadata is not an app import, and that branch\'s existing fixtures remain unchanged.', y, 9.5, gap=12)
y = note('Guard implementation detail', 'The minimal summary must be a new observed derived reference before its outbound check. Never relabel a raw salary-bearing offer as derived. Housing approval gives no bank permission.', y, 9.5, gap=12)
assert y > 65, y
c.showPage()

# Pages 3-9: seven independent supporting document specimens.
for page, doc in enumerate(DOCUMENTS, start=3):
    base(page, f'DOCUMENT {page-2:02d} / 07')
    y = title(doc['eyebrow'], doc['title'], doc['subtitle'])
    y = chip(doc['status'], y)
    y = fields(doc['fields'], y)
    if 'table' in doc:
        y = table(doc['table'], y)
    for label, text in doc['notes']:
        y = note(label, text, y)
    y = note('Intended demo recipient', doc['recipient'], y, 9.5)
    line('SPECIMEN REF  ' + doc['id'], MARGIN, 68, 7.5, color=MUTED)
    assert y > 85, (doc['slug'], y)
    c.showPage()
    source_lines = [NOTICE, doc['title'], doc['subtitle'], f'Document id: {doc["id"]}',
                    f'Case id: {CASE}', f'Status: {doc["status"]}', '']
    source_lines += [f'{label}: {value}' for label, value in doc['fields']]
    if 'table' in doc:
        source_lines += ['', ' | '.join(doc['table']['headers'])]
        source_lines += [' | '.join(row) for row in doc['table']['rows']]
    source_lines += [''] + [f'{label}: {text}' for label, text in doc['notes']]
    source_lines += ['', f'Intended demo recipient: {doc["recipient"]}', NOTICE, '']
    (DOC_DIR / (doc['slug'] + '.txt')).write_text('\n'.join(source_lines), encoding='utf-8')
    doc.update({'synthetic': True, 'case_id': CASE, 'pdf_page': page,
                'png': 'documents/' + doc['slug'] + '.png', 'text': 'documents/' + doc['slug'] + '.txt'})
c.save()
(ROOT / 'character.json').write_text(json.dumps(PROFILE, indent=2)+'\n', encoding='utf-8')
(ROOT / 'document-manifest.json').write_text(json.dumps({'synthetic': True, 'notice': NOTICE,
    'purpose': 'Authoring metadata, not an application import schema. Tags are narrative categories, not Guard data labels.',
    'documents': DOCUMENTS}, indent=2)+'\n', encoding='utf-8')
(ROOT / 'START-HERE.txt').write_text('''FAKE / FICTIONAL DEMO - NO OFFICIAL VALIDITY

MAYA KHALIL / RASIKH DEMO PACK
All people, issuers, identifiers, amounts, quote and events are invented.
Jordan, Amman, Abu Dhabi and Al Reem Island are real story settings.
No official crests, real signatures, valid passport numbers, MRZ, IBANs or
bank accounts are used. This is not evidence about a real customer or pilot.

OPEN: output/pdf/maya-khalil-demo-pack.pdf
The nine-page pack includes a character, a 90-second presenter guide,
and seven supporting fake documents. Every page has a FAKE banner,
watermark and footer. documents/ contains standalone PNGs and text copies.
character.json and document-manifest.json are editable authoring metadata.
Manifest tags are narrative categories, not Guard payload data labels.

WHY MAYA FITS
An employer-sponsored newcomer has an accepted offer and foreign documents,
but must coordinate different next actions with HR, a landlord and a bank.
The privacy moment denies raw salary to the landlord and shares only a
separate derived budget-fit result with an approved minimal packet.
Partner decisions remain pending. No real submissions have happened.

USING THE INSPECTED PROTOTYPE
The separately inspected agent-runtime branch (local friend-release-qa checkout)
accepts text for passport, bank_statement, emirates_id and degree. This does
not establish that the runtime is on main or deployed. This pack supplies
text companions for the first, second and fourth document kinds.
Paste the complete .txt companion for those kinds into a text-based extraction
demo. Do not claim image/PDF upload or offer extraction is implemented.
All five passport fields, both bank fields, and all three degree
fields have expected values in document-manifest.json.
The bank's closing balance is explicitly an invented AED equivalent.

The remaining documents support a staged/manual presentation. The pack has
distinct Maya ids and does not replace Alex Demo / hire_demo_001, caches,
Firestore seeds or evaluation documents on the separate runtime/eval branches.
Metadata is not app-import
JSON. Before app integration, map the story into actual app schemas and
preserve its visible synthetic labels and recipient-specific Guard checks.

The mixed offer needs employment AND salary labels. Raw salary and raw bank
data cannot reach the landlord under the demo policy, even with consent.
Actual bank-statement and degree payload labels are bank_statement and degree.
Housing/property data uses address. Keep budget_fit as an authoring tag; map
the financial lineage into a separate derived payload under the actual Guard
contract when integrating the storyboard, not an unknown data label.
Create and observe a new derived reference for the summary before checking
it. Never turn the raw offer into a derived document by changing a flag.
Passport consent is separate for landlord and bank. This scripted housing
approval shares neither the passport nor a bank packet.

The budget-fit result compares AED7,000 monthly rent with Maya's invented
AED8,000 budget. It is not a verified affordability score. There is no
claim that a provider accepts this evidence or agrees to four instalments.
Deposits, fees and payment method remain to be agreed. The support letter
is not a guarantee. The job offer is projected income, not a payslip.

REBUILD
Install Python 3.10+, the packages in requirements.txt, and Poppler (pdftoppm).
Run python3 rebuild_assets.py from this folder to rebuild the PDF, text, JSON,
document PNGs at 120 dpi, and ZIP bundle. See README.md for full instructions.
The source script includes the character values and page content. The rebuild
does not modify application fixtures or make any external provider requests.
''', encoding='utf-8')
print('Created nine-page fictional PDF, seven text companions, and authoring metadata.')
