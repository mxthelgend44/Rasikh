// skillpacks/draft-real-sites.ts
// DRAFT, UNVERIFIED packs for real website kinds. Written only from public, general knowledge of how such a
// process usually goes. They have NOT been checked against any live site (the live sites sit behind logins and
// change). No URL path, button label or field name is invented: controls are matched by generic role and by very
// common words, which can be wrong. Every step repeats the caveat. The person does every action; the guide only points.
import type { SkillPack, TaskStep } from "../src/shared/types";

const CAVEAT = "Draft guidance, not verified against the live site; names on the page may differ.";
const CAVEAT_AR = "إرشاد مسودة غير مُتحقَّق منه مع الموقع الفعلي؛ قد تختلف التسميات في الصفحة.";
const PD = "Personal details: the guide does not read what you type.";
const PD_AR = "بيانات شخصية: لا يقرأ المرشد ما تكتبه.";

// generic controls shared by all drafts: matched by role and common words, never by an exact label
const generic = (extra: SkillPack["views"][string]["controls"] = []) => ({
  any: {
    signature: [],
    controls: [
      { key: "signin", selectors: [{ kind: "roleName" as const, value: "link|sign in|log in|login" }, { kind: "roleName" as const, value: "button|sign in|log in|login" }] },
      { key: "find-service", selectors: [{ kind: "roleName" as const, value: "searchbox|search" }, { kind: "roleName" as const, value: "textbox|search" }] },
      { key: "start", selectors: [{ kind: "roleName" as const, value: "button|apply|start|new|open" }, { kind: "roleName" as const, value: "link|apply|start|new|open" }] },
      { key: "name-field", selectors: [{ kind: "roleName" as const, value: "textbox|name" }] },
      { key: "upload", selectors: [{ kind: "textInRegion" as const, value: "upload|attach|document" }] },
      { key: "continue", selectors: [{ kind: "roleName" as const, value: "button|next|continue" }] },
      { key: "fees", selectors: [{ kind: "textInRegion" as const, value: "fee|payment|amount|total|premium" }] },
      { key: "submit", selectors: [{ kind: "roleName" as const, value: "button|submit|send|confirm|pay" }] },
      ...extra
    ]
  }
});

function steps(what: string, whatAr: string, docs: string, docsAr: string): TaskStep[] {
  return [
    { id: "signin", title: "Sign in", titleAr: "تسجيل الدخول", controlKey: "signin", risk: "safe",
      instruction: `Find the sign-in control. You sign in yourself, with your own details. ${PD} ${CAVEAT}`,
      instructionAr: `ابحث عن زر تسجيل الدخول. تسجّل دخولك بنفسك ببياناتك. ${PD_AR} ${CAVEAT_AR}`,
      pitfalls: ["Check the address bar shows the official site you intended before you type anything."],
      tipAr: "تأكد أن شريط العنوان يعرض الموقع الرسمي الذي تقصده قبل أن تكتب أي شيء.", notes: CAVEAT },
    { id: "find", title: `Find ${what}`, titleAr: `ابحث عن ${whatAr}`, controlKey: "find-service", risk: "safe",
      instruction: `Look for a search box or a services list and find ${what}. You choose it yourself. ${CAVEAT}`,
      instructionAr: `ابحث عن مربع بحث أو قائمة خدمات وجد ${whatAr}. تختاره بنفسك. ${CAVEAT_AR}`,
      pitfalls: ["If several similar services appear, read each short description before choosing."],
      tipAr: "إن ظهرت خدمات متشابهة فاقرأ وصف كل منها قبل الاختيار.", notes: CAVEAT },
    { id: "start", title: "Start the request", titleAr: "ابدأ الطلب", controlKey: "start", risk: "safe",
      instruction: `Find the button that starts a new request and press it yourself. ${CAVEAT}`,
      instructionAr: `ابحث عن زر بدء طلب جديد واضغط عليه بنفسك. ${CAVEAT_AR}`,
      pitfalls: ["Starting a request is not submitting it. You can still stop."],
      tipAr: "بدء الطلب ليس إرساله. يمكنك التوقف.", notes: CAVEAT },
    { id: "details", title: "Your details", titleAr: "بياناتك", controlKey: "name-field", risk: "safe",
      instruction: `Fill the personal fields yourself, as in your documents. ${PD} ${CAVEAT}`,
      instructionAr: `املأ الحقول الشخصية بنفسك كما في مستنداتك. ${PD_AR} ${CAVEAT_AR}`,
      pitfalls: ["Compare each entry with your original documents before you go on."],
      tipAr: "قارن كل إدخال بمستنداتك الأصلية قبل المتابعة.", notes: CAVEAT },
    { id: "documents", title: "Documents", titleAr: "المستندات", controlKey: "upload", risk: "safe",
      instruction: `Find where documents are attached. Usually needed: ${docs}. You pick the files yourself; the guide never opens them. ${CAVEAT}`,
      instructionAr: `ابحث عن مكان إرفاق المستندات. عادةً يلزم: ${docsAr}. تختار الملفات بنفسك ولا يفتحها المرشد. ${CAVEAT_AR}`,
      pitfalls: ["Check the page for file type and size limits before you upload."],
      tipAr: "اطّلع على حدود نوع الملف وحجمه في الصفحة قبل الرفع.", notes: CAVEAT },
    { id: "fees", title: "Fees and review", titleAr: "الرسوم والمراجعة", controlKey: "fees", risk: "safe",
      instruction: `Find the fee or amount summary and read it before anything else. ${CAVEAT}`,
      instructionAr: `ابحث عن ملخص الرسوم أو المبلغ واقرأه قبل أي شيء آخر. ${CAVEAT_AR}`,
      pitfalls: ["If an amount looks different from what you were told, stop and ask the provider."],
      tipAr: "إن بدا المبلغ مختلفًا عمّا قيل لك فتوقف واسأل الجهة.", notes: CAVEAT },
    { id: "submit", title: "Submit", titleAr: "الإرسال", controlKey: "submit", risk: "confirm", last: true,
      instruction: `The final submit or pay button is yours alone to press; the guide never will. ${CAVEAT}`,
      instructionAr: `زر الإرسال أو الدفع النهائي لك وحدك؛ ولن يضغطه المرشد. ${CAVEAT_AR}`,
      pitfalls: ["A submitted request or payment may not be reversible. Be sure before you press."],
      tipAr: "قد لا يمكن التراجع عن الطلب أو الدفع بعد الإرسال. تأكد قبل الضغط.", notes: CAVEAT }
  ];
}

const policy = [{ match: "submit|pay|confirm|approve|send|agree|declar", level: "confirm" as const }, { match: "delete|remove|cancel", level: "confirm" as const }];

function draft(id: string, name: string, nameAr: string, patterns: string[], domains: string[], taskId: string, title: string, titleAr: string,
  what: string, whatAr: string, docs: string, docsAr: string, glossary: Record<string, string>, glossaryAr: Record<string, string>): SkillPack {
  return {
    id, name: `DRAFT, unverified: ${name}`, nameAr: `مسودة غير مُتحقَّق منها: ${nameAr}`, status: "draft-unverified", version: "0.1.0",
    urlPatterns: patterns, allowedDomains: domains, views: generic(), glossary, glossaryAr,
    tasks: [{ id: taskId, title: `${title} (draft, unverified)`, titleAr: `${titleAr} (مسودة غير مُتحقَّق منها)`,
      description: `${CAVEAT} Based only on public general knowledge of the process.`, descriptionAr: `${CAVEAT_AR} مبني فقط على معرفة عامة منشورة بالعملية.`,
      steps: steps(what, whatAr, docs, docsAr) }],
    riskPolicy: policy
  };
}

export const draftIcp: SkillPack = draft(
  "draft-icp-gov-ae", "federal identity and residency services (icp.gov.ae)", "خدمات الهوية والإقامة الاتحادية (icp.gov.ae)",
  ["https://icp.gov.ae/*", "https://*.icp.gov.ae/*"], ["icp.gov.ae"],
  "identity-or-residency-request", "Identity card or residency request", "طلب بطاقة هوية أو إقامة",
  "the identity card or residency service you need", "خدمة بطاقة الهوية أو الإقامة التي تحتاجها",
  "passport copy, a personal photo, the residency or entry permit details", "نسخة الجواز، صورة شخصية، بيانات الإقامة أو تصريح الدخول",
  { "Emirates ID": "The identity card issued to residents.", "residency permit": "The permit that allows you to live in the country." },
  { "Emirates ID": "بطاقة الهوية الصادرة للمقيمين.", "residency permit": "التصريح الذي يتيح لك الإقامة في الدولة." }
);

export const draftAddc: SkillPack = draft(
  "draft-addc-ae", "Abu Dhabi electricity and water account (addc.ae)", "حساب كهرباء ومياه أبوظبي (addc.ae)",
  ["https://addc.ae/*", "https://*.addc.ae/*"], ["addc.ae"],
  "new-utilities-account", "New electricity and water account", "حساب كهرباء ومياه جديد",
  "the service for opening a new account", "خدمة فتح حساب جديد",
  "tenancy contract, identity card, the premise number", "عقد الإيجار، بطاقة الهوية، رقم العقار",
  { "premise number": "The number that identifies the property. Usually on an earlier bill.", "security deposit": "A refundable amount some providers hold while the account is open." },
  { "premise number": "الرقم الذي يعرّف العقار، وعادةً يظهر في فاتورة سابقة.", "security deposit": "مبلغ قابل للاسترداد تحتفظ به بعض الجهات ما دام الحساب مفتوحًا." }
);

export const draftBank: SkillPack = draft(
  "draft-generic-bank", "a bank's online account opening (generic)", "فتح حساب مصرفي عبر الإنترنت (عام)",
  [], [],
  "open-bank-account", "Open a bank account", "فتح حساب مصرفي",
  "the account opening service", "خدمة فتح الحساب",
  "identity card, employer letter or proof of income, proof of address", "بطاقة الهوية، خطاب جهة العمل أو إثبات الدخل، إثبات العنوان",
  { "proof of income": "A document that shows what you earn, such as a salary certificate.", "tax residence": "The country where you are treated as living for tax." },
  { "proof of income": "مستند يبيّن دخلك، مثل شهادة الراتب.", "tax residence": "البلد الذي تُعدّ مقيمًا فيه لأغراض الضريبة." }
);

export const draftInsurance: SkillPack = draft(
  "draft-generic-health-insurance", "a health-insurance portal (generic)", "بوابة تأمين صحي (عام)",
  [], [],
  "buy-health-insurance", "Arrange health insurance", "ترتيب التأمين الصحي",
  "the health insurance plan or application", "خطة التأمين الصحي أو طلب التأمين",
  "identity card or passport, residency details, details of family members to cover", "بطاقة الهوية أو الجواز، بيانات الإقامة، بيانات أفراد الأسرة المراد تغطيتهم",
  { premium: "The price you pay for the cover.", "pre-existing condition": "A health problem you already have before the cover starts." },
  { premium: "السعر الذي تدفعه مقابل التغطية.", "pre-existing condition": "مشكلة صحية لديك قبل بدء التغطية." }
);
