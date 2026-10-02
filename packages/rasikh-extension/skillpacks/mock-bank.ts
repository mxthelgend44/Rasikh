// skillpacks/mock-bank.ts
// MOCK pack for the local bank onboarding portal at http://127.0.0.1:8793/bank/ (packages/rasikh-portals).
// Accurate to that mock (checked by skillpacks/packs.verify.ts). NOT guidance for any real bank. The bank name is made up.
import type { SkillPack } from "../src/shared/types";

const PD = "Personal details: the guide does not read what you type here.";
const PD_AR = "بيانات شخصية: لا يقرأ المرشد ما تكتبه هنا.";

export const mockBank: SkillPack = {
  id: "mock-bank",
  name: "Open a current account (MOCK bank)",
  nameAr: "فتح حساب جارٍ (مصرف تجريبي)",
  status: "mock",
  version: "1.0.0",
  urlPatterns: ["http://127.0.0.1:8793/bank/*", "http://localhost:8793/bank/*"],
  allowedDomains: ["127.0.0.1", "localhost"],
  views: {
    landing: {
      signature: [{ key: "start-link", selectors: [{ kind: "roleName", value: "link|Start the account request" }] }],
      controls: [{ key: "start-link", selectors: [{ kind: "roleName", value: "link|Start the account request" }] }]
    },
    personal: {
      signature: [{ key: "b-name", selectors: [{ kind: "roleName", value: "textbox|Full name" }] }],
      controls: [
        { key: "b-name", selectors: [{ kind: "roleName", value: "textbox|^Full name" }] },
        { key: "b-dob", selectors: [{ kind: "textInRegion", value: "Date of birth" }] },
        { key: "b-eid", selectors: [{ kind: "roleName", value: "textbox|Identity card number" }] },
        { key: "b-mobile", selectors: [{ kind: "roleName", value: "textbox|Mobile number" }] },
        { key: "b-email", selectors: [{ kind: "roleName", value: "textbox|^Email" }] },
        { key: "next", selectors: [{ kind: "roleName", value: "button|^Continue" }] }
      ]
    },
    employer: {
      signature: [{ key: "b-employer", selectors: [{ kind: "roleName", value: "textbox|Employer name" }] }],
      controls: [
        { key: "b-employer", selectors: [{ kind: "roleName", value: "textbox|Employer name" }] },
        { key: "b-letter", selectors: [{ kind: "textInRegion", value: "Employer letter" }] }
      ]
    },
    income: {
      signature: [{ key: "b-source", selectors: [{ kind: "roleName", value: "combobox|Main source of income" }] }],
      controls: [
        { key: "b-source", selectors: [{ kind: "roleName", value: "combobox|Main source of income" }] },
        { key: "b-source-desc", selectors: [{ kind: "roleName", value: "textbox|Describe your source of income" }] },
        { key: "b-range", selectors: [{ kind: "roleName", value: "combobox|Expected monthly income" }] }
      ]
    },
    tax: {
      signature: [{ key: "tax-no", selectors: [{ kind: "roleName", value: "radio|No" }] }],
      controls: [
        { key: "tax-no", selectors: [{ kind: "roleName", value: "radio|^No" }] },
        { key: "tax-yes", selectors: [{ kind: "roleName", value: "radio|^Yes" }] },
        { key: "tin", selectors: [{ kind: "roleName", value: "textbox|Tax identification number" }] },
        { key: "fatca-ok", selectors: [{ kind: "roleName", value: "checkbox|my answers about tax residence" }] }
      ]
    },
    review: {
      signature: [{ key: "b-agree", selectors: [{ kind: "roleName", value: "checkbox|I have read the account terms" }] }],
      controls: [
        { key: "b-terms-open", selectors: [{ kind: "roleName", value: "button|Read the account terms" }] },
        { key: "b-agree", selectors: [{ kind: "roleName", value: "checkbox|account terms" }] },
        { key: "submit", selectors: [{ kind: "roleName", value: "button|Submit account application" }] }
      ]
    }
  },
  glossary: {
    "salary certificate": "A letter from your employer stating your job and pay. Banks use it to check your income.",
    "source of income": "Where your money comes from: salary, a business, savings or something else.",
    "tax residence": "The country where you are treated as living for tax. Banks must ask, and report in some cases.",
    "tax identification number": "The number your tax authority gave you. Not every country has one."
  },
  glossaryAr: {
    "salary certificate": "خطاب من جهة عملك يبيّن وظيفتك وراتبك. تستخدمه المصارف للتحقق من دخلك.",
    "source of income": "من أين يأتي مالك: راتب أو نشاط تجاري أو مدخرات أو غير ذلك.",
    "tax residence": "البلد الذي تُعدّ مقيمًا فيه لأغراض الضريبة. تسأل المصارف عنه وقد تبلّغ عنه.",
    "tax identification number": "الرقم الذي منحتك إياه الجهة الضريبية. ليس لكل بلد رقم كهذا."
  },
  tasks: [
    {
      id: "open-current-account",
      title: "Open a current account (mock)",
      titleAr: "فتح حساب جارٍ (تجريبي)",
      description: "Five steps on a MOCK bank site, then a Submit that only you press. Nothing is sent anywhere.",
      descriptionAr: "خمس خطوات على موقع مصرف تجريبي، ثم زر إرسال لا يضغطه إلا أنت. لا يُرسَل شيء إلى أي جهة.",
      steps: [
        {
          id: "start", title: "Start", titleAr: "البداية", controlKey: "start-link", risk: "safe",
          instruction: "Find the Start the account request link and click it yourself. Have your identity card, employer letter and income details nearby.",
          instructionAr: "ابحث عن رابط ابدأ طلب فتح الحساب واضغط عليه بنفسك. أبقِ بطاقة الهوية وخطاب العمل وتفاصيل الدخل قريبة منك.",
          pitfalls: ["Check that the address bar shows the bank you intended before you type anything."],
          tipAr: "تأكد من أن شريط العنوان يعرض المصرف الذي تقصده قبل أن تكتب أي شيء."
        },
        {
          id: "personal", title: "Personal details", titleAr: "البيانات الشخصية", controlKey: "b-name", risk: "safe",
          instruction: "Fill Full name, date of birth, identity card number, mobile and email yourself. " + PD,
          instructionAr: "املأ الاسم الكامل وتاريخ الميلاد ورقم بطاقة الهوية والهاتف والبريد بنفسك. " + PD_AR,
          pitfalls: ["Your name must match your identity card exactly; banks compare them."],
          tipAr: "يجب أن يطابق اسمك بطاقة الهوية تمامًا؛ فالمصارف تقارن بينهما."
        },
        {
          id: "employer", title: "Employer name", titleAr: "اسم جهة العمل", controlKey: "b-employer", risk: "safe",
          instruction: "Press Continue yourself, then type your employer's name yourself, as on your contract.",
          instructionAr: "اضغط متابعة بنفسك، ثم اكتب اسم جهة عملك بنفسك كما في العقد.",
          pitfalls: ["Use the same employer name that appears on the letter you will upload."],
          tipAr: "استخدم اسم جهة العمل نفسه الظاهر في الخطاب الذي سترفعه."
        },
        {
          id: "letter", title: "Upload the employer letter", titleAr: "رفع خطاب جهة العمل", controlKey: "b-letter", risk: "safe",
          instruction: "Find the Employer letter file chooser and pick your salary certificate yourself. Personal file: the guide never opens it or reads its name.",
          instructionAr: "ابحث عن زر اختيار خطاب جهة العمل واختر شهادة الراتب بنفسك. ملف شخصي: لا يفتحه المرشد ولا يقرأ اسمه.",
          pitfalls: ["The letter should be recent and signed; check the date before you upload."],
          tipAr: "يجب أن يكون الخطاب حديثًا وموقّعًا؛ تحقق من التاريخ قبل الرفع."
        },
        {
          id: "income", title: "Source of income", titleAr: "مصدر الدخل", controlKey: "b-source", risk: "safe",
          instruction: "Choose your main source of income yourself. If you pick Something else, a box appears asking you to describe it.",
          instructionAr: "اختر مصدر دخلك الرئيسي بنفسك. إن اخترت مصدرًا آخر يظهر مربع لوصفه.",
          pitfalls: ["Answer truthfully; banks may ask for proof later."],
          tipAr: "أجب بصدق؛ فقد تطلب المصارف إثباتًا لاحقًا."
        },
        {
          id: "range", title: "Expected monthly income", titleAr: "الدخل الشهري المتوقع", controlKey: "b-range", risk: "safe",
          instruction: "This dropdown is a custom list. Open it and choose the range that fits, yourself.",
          instructionAr: "هذه القائمة مخصصة. افتحها واختر الفئة المناسبة بنفسك.",
          pitfalls: ["Pick the range of what you actually expect to receive, not the highest."],
          tipAr: "اختر فئة ما تتوقع فعلًا أن تتلقاه، لا الأعلى."
        },
        {
          id: "tax", title: "Tax residence", titleAr: "الإقامة الضريبية", controlKey: "tax-no", risk: "confirm",
          instruction: "Answer whether you are a tax resident of another country, yourself. If you answer Yes, fields for the country and a tax number appear. Tax number: personal data the guide does not read.",
          instructionAr: "أجب بنفسك هل أنت مقيم لأغراض ضريبية في دولة أخرى. إن أجبت بنعم تظهر حقول الدولة والرقم الضريبي. الرقم الضريبي بيان شخصي لا يقرأه المرشد.",
          pitfalls: ["If you are unsure of your tax residence, ask a tax adviser before you answer; the answer is a declaration."],
          tipAr: "إن لم تكن متأكدًا من إقامتك الضريبية فاسأل مستشارًا ضريبيًا قبل الإجابة؛ فالإجابة إقرار."
        },
        {
          id: "fatca-confirm", title: "Confirm the declaration", titleAr: "تأكيد الإقرار", controlKey: "fatca-ok", risk: "confirm",
          instruction: "Tick the confirmation yourself only if your answers are correct. The guide never ticks it for you.",
          instructionAr: "ضع علامة التأكيد بنفسك فقط إن كانت إجاباتك صحيحة. لا يضع المرشد العلامة عنك.",
          pitfalls: ["You are the one declaring this to the bank."],
          tipAr: "أنت من يقرّ بهذا أمام المصرف."
        },
        {
          id: "terms", title: "Account terms", titleAr: "شروط الحساب", controlKey: "b-terms-open", risk: "safe",
          instruction: "Press Read the account terms yourself to open a pop-up window. Read it, then close it.",
          instructionAr: "اضغط قراءة شروط الحساب بنفسك لتفتح نافذة منبثقة. اقرأها ثم أغلقها.",
          pitfalls: ["Look for monthly fees and minimum balance conditions."],
          tipAr: "ابحث عن الرسوم الشهرية وشروط الحد الأدنى للرصيد."
        },
        {
          id: "agree", title: "Agree to the terms", titleAr: "الموافقة على الشروط", controlKey: "b-agree", risk: "confirm",
          instruction: "Tick the agreement yourself if you accept the terms. The Submit button stays disabled until you do.",
          instructionAr: "ضع علامة الموافقة بنفسك إن كنت تقبل الشروط. يبقى زر الإرسال معطلًا حتى تفعل.",
          pitfalls: ["If Submit is still grey, the box is not ticked."],
          tipAr: "إذا بقي زر الإرسال رماديًا فالعلامة غير موضوعة."
        },
        {
          id: "submit", title: "Submit", titleAr: "الإرسال", controlKey: "submit", risk: "confirm", last: true,
          instruction: "This is the final Submit button. Only you press it; the guide never will. On this mock site it only shows a page saying nothing was sent.",
          instructionAr: "هذا زر الإرسال النهائي. أنت وحدك تضغط عليه ولن يضغطه المرشد. في هذا الموقع التجريبي تظهر فقط صفحة تقول إن شيئًا لم يُرسَل.",
          pitfalls: ["On a real bank an application can create a credit check or fees. Be sure before you press."],
          tipAr: "في مصرف حقيقي قد يترتب على الطلب استعلام ائتماني أو رسوم. تأكد قبل الضغط."
        }
      ]
    }
  ],
  riskPolicy: [
    { match: "submit|pay|confirm|approve|send|agree|declar", level: "confirm" },
    { match: "delete|remove|cancel", level: "confirm" }
  ]
};
