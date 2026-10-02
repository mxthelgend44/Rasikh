// skillpacks/mock-icp.ts
// MOCK pack for the local identity-services portal at http://127.0.0.1:8793/icp/ (packages/rasikh-portals).
// It is accurate to that mock (checked by skillpacks/packs.verify.ts). It is NOT guidance for any real website.
// Rasikh rule: coach, do not do. Every step says what the person does themselves; personal fields are flagged.
import type { SkillPack } from "../src/shared/types";

const PD = "Personal details: the guide does not read what you type here.";
const PD_AR = "بيانات شخصية: لا يقرأ المرشد ما تكتبه هنا.";

export const mockIcp: SkillPack = {
  id: "mock-icp",
  name: "Emirates ID application (MOCK portal)",
  nameAr: "طلب بطاقة الهوية (بوابة تجريبية)",
  status: "mock",
  version: "1.0.0",
  urlPatterns: ["http://127.0.0.1:8793/icp/*", "http://localhost:8793/icp/*"],
  allowedDomains: ["127.0.0.1", "localhost"],
  views: {
    landing: {
      signature: [{ key: "signin-link", selectors: [{ kind: "roleName", value: "link|Sign in with UAE PASS" }] }],
      controls: [{ key: "signin-link", selectors: [{ kind: "roleName", value: "link|Sign in with UAE PASS" }, { kind: "textInRegion", value: "UAE PASS" }] }]
    },
    signin: {
      signature: [{ key: "signin-user", selectors: [{ kind: "roleName", value: "textbox|Username or mobile number" }] }],
      controls: [
        { key: "signin-user", selectors: [{ kind: "roleName", value: "textbox|Username or mobile number" }] },
        { key: "signin-pin", selectors: [{ kind: "roleName", value: "textbox|^PIN" }] },
        { key: "signin-continue", selectors: [{ kind: "roleName", value: "button|^Continue" }] }
      ]
    },
    applicant: {
      signature: [{ key: "full-name", selectors: [{ kind: "roleName", value: "textbox|Full name" }] }],
      controls: [
        { key: "full-name", selectors: [{ kind: "roleName", value: "textbox|Full name" }] },
        { key: "dob", selectors: [{ kind: "textInRegion", value: "Date of birth" }] },
        { key: "nationality", selectors: [{ kind: "roleName", value: "combobox|Nationality" }] },
        { key: "passport-no", selectors: [{ kind: "roleName", value: "textbox|Passport number" }] },
        { key: "mobile", selectors: [{ kind: "roleName", value: "textbox|Mobile number" }] },
        { key: "next", selectors: [{ kind: "roleName", value: "button|^Continue" }] }
      ]
    },
    documents: {
      signature: [{ key: "photo", selectors: [{ kind: "textInRegion", value: "Personal photo" }] }],
      controls: [
        { key: "photo", selectors: [{ kind: "textInRegion", value: "Personal photo" }] },
        { key: "passport-copy", selectors: [{ kind: "textInRegion", value: "Passport copy" }] }
      ]
    },
    visa: {
      signature: [{ key: "visa-file", selectors: [{ kind: "roleName", value: "textbox|Visa file number" }] }],
      controls: [
        { key: "visa-file", selectors: [{ kind: "roleName", value: "textbox|Visa file number" }] },
        { key: "visa-expiry", selectors: [{ kind: "textInRegion", value: "Visa expiry date" }] },
        { key: "sponsor-employer", selectors: [{ kind: "roleName", value: "radio|^Employer" }] },
        { key: "sponsor-family", selectors: [{ kind: "roleName", value: "radio|family member" }] },
        { key: "est-no", selectors: [{ kind: "roleName", value: "textbox|Establishment card number" }] }
      ]
    },
    "address-dialog": {
      signature: [{ key: "confirm-address", selectors: [{ kind: "roleName", value: "button|Confirm and continue" }] }],
      controls: [
        { key: "confirm-address", selectors: [{ kind: "roleName", value: "button|Confirm and continue" }] },
        { key: "edit-address", selectors: [{ kind: "roleName", value: "button|^Edit" }] }
      ]
    },
    address: {
      signature: [{ key: "emirate", selectors: [{ kind: "roleName", value: "combobox|Emirate" }] }],
      controls: [
        { key: "emirate", selectors: [{ kind: "roleName", value: "combobox|^Emirate" }] },
        { key: "area", selectors: [{ kind: "roleName", value: "textbox|^Area" }] },
        { key: "street", selectors: [{ kind: "roleName", value: "textbox|^Street" }] }
      ]
    },
    declaration: {
      signature: [{ key: "declare", selectors: [{ kind: "roleName", value: "checkbox|I declare" }] }],
      controls: [
        { key: "declare", selectors: [{ kind: "roleName", value: "checkbox|I declare" }] },
        { key: "declaration-continue", selectors: [{ kind: "roleName", value: "button|^Continue" }] }
      ]
    },
    payment: {
      signature: [{ key: "submit", selectors: [{ kind: "roleName", value: "button|Submit application" }] }],
      controls: [
        { key: "pay-online", selectors: [{ kind: "roleName", value: "radio|Pay online" }] },
        { key: "pay-centre", selectors: [{ kind: "roleName", value: "radio|service centre" }] },
        { key: "submit", selectors: [{ kind: "roleName", value: "button|Submit application" }] }
      ]
    }
  },
  glossary: {
    "UAE PASS": "A national digital identity sign in. On this MOCK site it is a plain practice form that accepts nothing real.",
    "residency visa": "The permit that lets you live in the country. Its file number links your Emirates ID to it.",
    sponsor: "The employer, family member or company that holds your residency.",
    declaration: "A statement you sign that your details are true. You are responsible for what you declare."
  },
  glossaryAr: {
    "UAE PASS": "تسجيل دخول وطني بالهوية الرقمية. في هذا الموقع التجريبي هو نموذج تدريب لا يقبل شيئًا حقيقيًا.",
    "residency visa": "التصريح الذي يتيح لك الإقامة. رقم ملفه يربط بطاقتك به.",
    sponsor: "جهة العمل أو أحد أفراد الأسرة أو الشركة التي تكفل إقامتك.",
    declaration: "إقرار توقّعه بأن بياناتك صحيحة، وأنت المسؤول عمّا تقرّ به."
  },
  tasks: [
    {
      id: "emirates-id-application",
      title: "Apply for an Emirates ID (mock)",
      titleAr: "التقديم على بطاقة الهوية (تجريبي)",
      description: "Six steps on a MOCK portal, then a final Submit that only you press. Nothing is sent anywhere.",
      descriptionAr: "ست خطوات على بوابة تجريبية، ثم زر إرسال نهائي لا يضغطه إلا أنت. لا يُرسَل شيء إلى أي جهة.",
      steps: [
        {
          id: "signin", title: "Sign in", titleAr: "تسجيل الدخول", controlKey: "signin-link", risk: "safe",
          instruction: "Find the Sign in with UAE PASS link. You click it yourself, then on the next page you type your own sign-in details. " + PD,
          instructionAr: "ابحث عن رابط تسجيل الدخول بالهوية الرقمية. اضغط عليه بنفسك، ثم اكتب بياناتك بنفسك في الصفحة التالية. " + PD_AR,
          pitfalls: ["Check the address bar shows the site you meant to use before you type any sign-in detail."],
          tipAr: "تأكد من عنوان الموقع في شريط العنوان قبل كتابة أي بيانات دخول.",
          notes: "The mock sign in accepts nothing real. Never read or repeat the username or PIN fields."
        },
        {
          id: "applicant", title: "Applicant details", titleAr: "بيانات مقدم الطلب", controlKey: "full-name", risk: "safe",
          instruction: "Start with Full name. Type it exactly as it appears in your passport, then fill date of birth, nationality, passport number and mobile number yourself. " + PD,
          instructionAr: "ابدأ بحقل الاسم الكامل. اكتبه تمامًا كما في جواز سفرك، ثم املأ تاريخ الميلاد والجنسية ورقم الجواز والهاتف بنفسك. " + PD_AR,
          pitfalls: ["Compare the spelling of your name and the passport number with the passport itself, character by character."],
          tipAr: "قارن حروف اسمك ورقم الجواز بالجواز نفسه حرفًا حرفًا.",
          notes: "Nationality is a custom dropdown: open it, then pick an option yourself. Do not read field values."
        },
        {
          id: "nationality", title: "Nationality dropdown", titleAr: "قائمة الجنسية", controlKey: "nationality", risk: "safe",
          instruction: "This dropdown is a custom list, not a normal select. Open it and choose your nationality yourself.",
          instructionAr: "هذه القائمة مخصصة وليست قائمة عادية. افتحها واختر جنسيتك بنفسك.",
          pitfalls: ["Choose the nationality printed in your passport, not your country of residence."],
          tipAr: "اختر الجنسية المكتوبة في جواز السفر، لا بلد إقامتك."
        },
        {
          id: "next-1", title: "Continue to documents", titleAr: "المتابعة إلى المستندات", controlKey: "next", risk: "safe",
          instruction: "When every starred field is complete, press Continue yourself. The page shows the next step in the same place.",
          instructionAr: "عندما تكتمل كل الحقول المعلَّمة بنجمة، اضغط متابعة بنفسك. تظهر الخطوة التالية في المكان نفسه.",
          pitfalls: ["If a red message appears, read which fields it lists and fix those first."],
          tipAr: "إذا ظهرت رسالة حمراء، اقرأ الحقول المذكورة وصحّحها أولًا."
        },
        {
          id: "photo", title: "Upload your photo", titleAr: "رفع الصورة الشخصية", controlKey: "photo", risk: "safe",
          instruction: "Find the Personal photo file chooser. You pick the file from your computer yourself. Personal files: the guide never opens or reads them, nor their names.",
          instructionAr: "ابحث عن زر اختيار الصورة الشخصية. تختار الملف من جهازك بنفسك. ملفات شخصية: لا يفتحها المرشد ولا يقرأ أسماءها.",
          pitfalls: ["Use a recent photo on a white background, as the page asks."],
          tipAr: "استخدم صورة حديثة بخلفية بيضاء كما تطلب الصفحة."
        },
        {
          id: "passport-copy", title: "Upload your passport copy", titleAr: "رفع نسخة الجواز", controlKey: "passport-copy", risk: "safe",
          instruction: "Find the Passport copy file chooser and pick the scan of your passport data page yourself. Personal file: the guide does not read it.",
          instructionAr: "ابحث عن زر اختيار نسخة الجواز واختر ملف صفحة البيانات بنفسك. ملف شخصي: لا يقرأه المرشد.",
          pitfalls: ["Make sure all four corners of the page are visible and the text is sharp."],
          tipAr: "تأكد أن زوايا الصفحة الأربع ظاهرة والكتابة واضحة."
        },
        {
          id: "visa", title: "Residency visa file", titleAr: "ملف تأشيرة الإقامة", controlKey: "visa-file", risk: "safe",
          instruction: "Find Visa file number and type it yourself from your visa document. " + PD,
          instructionAr: "ابحث عن حقل رقم ملف التأشيرة واكتبه بنفسك من مستند التأشيرة. " + PD_AR,
          pitfalls: ["The file number is not the passport number. Copy it from the visa document."],
          tipAr: "رقم الملف ليس رقم الجواز. انسخه من مستند التأشيرة."
        },
        {
          id: "sponsor", title: "Sponsor type", titleAr: "نوع الكفيل", controlKey: "sponsor-employer", risk: "safe",
          instruction: "Choose who sponsors your residency by selecting one option yourself. After you choose, an extra field appears below it that was not on the page before.",
          instructionAr: "اختر بنفسك من يكفل إقامتك. بعد الاختيار يظهر حقل إضافي تحته لم يكن في الصفحة من قبل.",
          pitfalls: ["Fill the extra field that appears, then check it matches your visa document."],
          tipAr: "املأ الحقل الإضافي الذي يظهر، ثم تأكد أنه يطابق مستند التأشيرة."
        },
        {
          id: "address", title: "Delivery address", titleAr: "عنوان التسليم", controlKey: "emirate", risk: "safe",
          instruction: "Choose the emirate, then type area and street yourself. " + PD,
          instructionAr: "اختر الإمارة، ثم اكتب المنطقة والشارع بنفسك. " + PD_AR,
          pitfalls: ["Use an address where someone can receive the card; couriers usually will not leave it."],
          tipAr: "استخدم عنوانًا يستطيع أحد الاستلام فيه، فالمندوب غالبًا لا يترك البطاقة."
        },
        {
          id: "address-confirm", title: "Confirm the address", titleAr: "تأكيد العنوان", controlKey: "confirm-address", risk: "safe",
          instruction: "A pop-up window asks you to confirm the address. Read it, then press Confirm and continue yourself, or press Edit to change it.",
          instructionAr: "تظهر نافذة منبثقة تطلب تأكيد العنوان. اقرأه ثم اضغط تأكيد ومتابعة بنفسك، أو اضغط تعديل لتغييره.",
          pitfalls: ["While the pop-up is open the rest of the page is locked; close or answer it first."],
          tipAr: "أثناء فتح النافذة تكون بقية الصفحة مقفلة؛ أجب عنها أو أغلقها أولًا."
        },
        {
          id: "declaration", title: "Declaration", titleAr: "الإقرار", controlKey: "declare", risk: "confirm",
          instruction: "Read the declaration, then tick the checkbox yourself if it is true. The Continue button stays disabled until you do. The guide never ticks it for you.",
          instructionAr: "اقرأ الإقرار، ثم ضع علامة بنفسك إن كان صحيحًا. يبقى زر المتابعة معطلًا حتى تفعل ذلك. لا يضع المرشد العلامة عنك.",
          pitfalls: ["You are the one responsible for what you declare. Do not tick it if something is not accurate."],
          tipAr: "أنت المسؤول عمّا تقرّ به. لا تضع العلامة إن كان شيء غير دقيق."
        },
        {
          id: "payment", title: "Payment summary", titleAr: "ملخص الدفع", controlKey: "pay-online", risk: "safe",
          instruction: "Read the fee table (mock amounts), then choose a payment method yourself. Nothing is charged on this mock site.",
          instructionAr: "اقرأ جدول الرسوم (مبالغ تجريبية)، ثم اختر طريقة الدفع بنفسك. لا يُخصم شيء في هذا الموقع التجريبي.",
          pitfalls: ["Check the total matches what you expect before you go on."],
          tipAr: "تأكد أن الإجمالي يطابق ما تتوقعه قبل المتابعة."
        },
        {
          id: "submit", title: "Submit", titleAr: "الإرسال", controlKey: "submit", risk: "confirm", last: true,
          instruction: "This is the final Submit button. Review everything first. Only you press it; the guide never will. On this mock site it only shows a page saying nothing was sent.",
          instructionAr: "هذا زر الإرسال النهائي. راجع كل شيء أولًا. أنت وحدك تضغط عليه، ولن يضغطه المرشد. في هذا الموقع التجريبي تظهر فقط صفحة تقول إن شيئًا لم يُرسَل.",
          pitfalls: ["On a real site a submit cannot always be undone. Stop and check if you are unsure."],
          tipAr: "في موقع حقيقي قد لا يمكن التراجع عن الإرسال. توقف وتحقق إن كنت غير متأكد."
        }
      ]
    }
  ],
  riskPolicy: [
    { match: "submit|pay|confirm|approve|send|agree|declar", level: "confirm" },
    { match: "delete|remove|cancel", level: "confirm" }
  ]
};
