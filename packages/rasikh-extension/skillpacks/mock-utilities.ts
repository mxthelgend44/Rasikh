// skillpacks/mock-utilities.ts
// MOCK pack for the local water-and-power portal at http://127.0.0.1:8793/utilities/ (packages/rasikh-portals).
// Accurate to that mock (checked by skillpacks/packs.verify.ts). NOT guidance for any real utility website.
import type { SkillPack } from "../src/shared/types";

const PD = "Personal details: the guide does not read what you type here.";
const PD_AR = "بيانات شخصية: لا يقرأ المرشد ما تكتبه هنا.";

export const mockUtilities: SkillPack = {
  id: "mock-utilities",
  name: "Open a utilities account (MOCK portal)",
  nameAr: "فتح حساب مياه وكهرباء (بوابة تجريبية)",
  status: "mock",
  version: "1.0.0",
  urlPatterns: ["http://127.0.0.1:8793/utilities/*", "http://localhost:8793/utilities/*"],
  allowedDomains: ["127.0.0.1", "localhost"],
  views: {
    landing: {
      signature: [{ key: "start-link", selectors: [{ kind: "roleName", value: "link|Start the account request" }] }],
      controls: [{ key: "start-link", selectors: [{ kind: "roleName", value: "link|Start the account request" }] }]
    },
    "premise-help": {
      signature: [{ key: "help-close", selectors: [{ kind: "roleName", value: "button|Close help" }] }],
      controls: [{ key: "help-close", selectors: [{ kind: "roleName", value: "button|Close help" }] }]
    },
    premise: {
      signature: [{ key: "tenancy-no", selectors: [{ kind: "roleName", value: "textbox|Tenancy contract number" }] }],
      controls: [
        { key: "tenancy-no", selectors: [{ kind: "roleName", value: "textbox|Tenancy contract number" }] },
        { key: "premise-no", selectors: [{ kind: "roleName", value: "textbox|Premise number" }] },
        { key: "premise-help", selectors: [{ kind: "roleName", value: "button|Where do I find the premise number" }] },
        { key: "premise-type", selectors: [{ kind: "roleName", value: "combobox|Premise type" }] },
        { key: "next", selectors: [{ kind: "roleName", value: "button|^Continue" }] }
      ]
    },
    holder: {
      signature: [{ key: "holder-name", selectors: [{ kind: "roleName", value: "textbox|Account holder name" }] }],
      controls: [
        { key: "holder-name", selectors: [{ kind: "roleName", value: "textbox|Account holder name" }] },
        { key: "holder-id", selectors: [{ kind: "roleName", value: "textbox|Identity number" }] },
        { key: "holder-phone", selectors: [{ kind: "roleName", value: "textbox|Phone number" }] }
      ]
    },
    meter: {
      signature: [{ key: "meter-type", selectors: [{ kind: "roleName", value: "combobox|Meter type" }] }],
      controls: [
        { key: "meter-type", selectors: [{ kind: "roleName", value: "combobox|Meter type" }] },
        { key: "has-meter-yes", selectors: [{ kind: "roleName", value: "radio|^Yes" }] },
        { key: "meter-no", selectors: [{ kind: "roleName", value: "textbox|Meter number" }] }
      ]
    },
    payment: {
      signature: [{ key: "pay-debit", selectors: [{ kind: "roleName", value: "radio|Direct debit" }] }],
      controls: [
        { key: "pay-debit", selectors: [{ kind: "roleName", value: "radio|Direct debit" }] },
        { key: "pay-card", selectors: [{ kind: "roleName", value: "radio|Pay by card" }] },
        { key: "iban", selectors: [{ kind: "roleName", value: "textbox|IBAN" }] }
      ]
    },
    submit: {
      signature: [{ key: "agree-terms", selectors: [{ kind: "roleName", value: "checkbox|I agree to the terms" }] }],
      controls: [
        { key: "terms-open", selectors: [{ kind: "roleName", value: "button|Read the terms" }] },
        { key: "agree-terms", selectors: [{ kind: "roleName", value: "checkbox|I agree to the terms" }] },
        { key: "submit", selectors: [{ kind: "roleName", value: "button|Submit account request" }] }
      ]
    }
  },
  glossary: {
    "premise number": "The number that identifies the property itself, not you. It is on an earlier bill, or your landlord knows it.",
    "tenancy contract number": "The registration number on your rental contract.",
    "direct debit": "You allow the provider to take each bill from your bank account automatically.",
    meter: "The device that measures how much water or electricity you use."
  },
  glossaryAr: {
    "premise number": "الرقم الذي يعرّف العقار نفسه لا أنت. تجده في فاتورة سابقة، أو يعرفه المالك.",
    "tenancy contract number": "رقم التسجيل في عقد الإيجار.",
    "direct debit": "تسمح للجهة بأن تأخذ كل فاتورة من حسابك المصرفي تلقائيًا.",
    meter: "الجهاز الذي يقيس كمية المياه أو الكهرباء التي تستهلكها."
  },
  tasks: [
    {
      id: "open-utilities-account",
      title: "Open a new water and power account (mock)",
      titleAr: "فتح حساب مياه وكهرباء جديد (تجريبي)",
      description: "Five steps on a MOCK portal, then a Submit that only you press. Nothing is sent anywhere.",
      descriptionAr: "خمس خطوات على بوابة تجريبية، ثم زر إرسال لا يضغطه إلا أنت. لا يُرسَل شيء إلى أي جهة.",
      steps: [
        {
          id: "start", title: "Start the request", titleAr: "ابدأ الطلب", controlKey: "start-link", risk: "safe",
          instruction: "Find the Start the account request link and click it yourself. Keep your tenancy contract and an earlier bill nearby.",
          instructionAr: "ابحث عن رابط ابدأ طلب الحساب واضغط عليه بنفسك. أبقِ عقد الإيجار وفاتورة سابقة قريبين منك.",
          pitfalls: ["Have the tenancy contract number ready; it is the first thing the form asks for."],
          tipAr: "جهّز رقم عقد الإيجار؛ فهو أول ما يطلبه النموذج."
        },
        {
          id: "tenancy", title: "Tenancy contract number", titleAr: "رقم عقد الإيجار", controlKey: "tenancy-no", risk: "safe",
          instruction: "Find Tenancy contract number and type it yourself from your rental contract.",
          instructionAr: "ابحث عن حقل رقم عقد الإيجار واكتبه بنفسك من عقدك.",
          pitfalls: ["Copy the number exactly, including any dashes or letters."],
          tipAr: "انسخ الرقم كما هو، بما في ذلك الشرطات والحروف."
        },
        {
          id: "premise", title: "Premise number", titleAr: "رقم العقار", controlKey: "premise-no", risk: "safe",
          instruction: "Find Premise number and type it yourself. If you do not know where to find it, press the help button next to it; a pop-up window explains.",
          instructionAr: "ابحث عن حقل رقم العقار واكتبه بنفسك. إن لم تعرف أين تجده فاضغط زر المساعدة بجانبه لتظهر نافذة توضح ذلك.",
          pitfalls: ["The premise number identifies the property, not you. Do not use your contract number here."],
          tipAr: "رقم العقار يعرّف المبنى لا أنت. لا تستخدم رقم العقد هنا."
        },
        {
          id: "premise-type", title: "Premise type", titleAr: "نوع العقار", controlKey: "premise-type", risk: "safe",
          instruction: "This dropdown is a custom list. Open it and choose the premise type yourself.",
          instructionAr: "هذه القائمة مخصصة. افتحها واختر نوع العقار بنفسك.",
          pitfalls: ["Pick the option that matches your contract (apartment, villa or shared)."],
          tipAr: "اختر الخيار الذي يطابق عقدك (شقة أو فيلا أو سكن مشترك)."
        },
        {
          id: "holder", title: "Account holder", titleAr: "صاحب الحساب", controlKey: "holder-name", risk: "safe",
          instruction: "Press Continue yourself, then fill Account holder name, identity number and phone yourself. " + PD,
          instructionAr: "اضغط متابعة بنفسك، ثم املأ اسم صاحب الحساب ورقم الهوية والهاتف بنفسك. " + PD_AR,
          pitfalls: ["The account holder should be the person named on the tenancy contract."],
          tipAr: "يجب أن يكون صاحب الحساب هو المذكور في عقد الإيجار."
        },
        {
          id: "meter-type", title: "Meter type", titleAr: "نوع العدّاد", controlKey: "meter-type", risk: "safe",
          instruction: "Choose the meter type yourself. Then answer whether you have the meter number; if you say Yes, a new field appears for it.",
          instructionAr: "اختر نوع العدّاد بنفسك. ثم أجب هل لديك رقم العدّاد؛ إن اخترت نعم يظهر حقل جديد له.",
          pitfalls: ["Choose Electricity and water only if both services are installed in the property."],
          tipAr: "اختر كهرباء ومياه فقط إذا كانت الخدمتان مركّبتين في العقار."
        },
        {
          id: "payment", title: "Payment method", titleAr: "طريقة الدفع", controlKey: "pay-debit", risk: "confirm",
          instruction: "Choose how you will pay, yourself. If you choose Direct debit, a bank account number field appears. Banking data: the guide does not read it.",
          instructionAr: "اختر طريقة الدفع بنفسك. إن اخترت الخصم المباشر يظهر حقل رقم الحساب المصرفي. بيانات مصرفية: لا يقرأها المرشد.",
          pitfalls: ["Direct debit lets the provider take money from your account each month. Choose it only if you want that."],
          tipAr: "الخصم المباشر يسمح للجهة بسحب المال من حسابك كل شهر. اخترْه فقط إن كنت تريد ذلك."
        },
        {
          id: "terms", title: "Terms", titleAr: "الشروط", controlKey: "terms-open", risk: "safe",
          instruction: "Press Read the terms yourself to open a pop-up window with the terms. Read it, then close it.",
          instructionAr: "اضغط قراءة الشروط بنفسك لتفتح نافذة بالشروط. اقرأها ثم أغلقها.",
          pitfalls: ["Agreeing is a decision that is yours alone; read before you tick."],
          tipAr: "الموافقة قرارك وحدك؛ اقرأ قبل أن تضع العلامة."
        },
        {
          id: "agree", title: "Agree to the terms", titleAr: "الموافقة على الشروط", controlKey: "agree-terms", risk: "confirm",
          instruction: "Tick I agree to the terms yourself, if you do agree. The Submit button stays disabled until you do. The guide never ticks it.",
          instructionAr: "ضع علامة أوافق على الشروط بنفسك إن كنت توافق. يبقى زر الإرسال معطلًا حتى تفعل. لا يضع المرشد العلامة.",
          pitfalls: ["If the Submit button is still grey, the box is not ticked."],
          tipAr: "إذا بقي زر الإرسال رماديًا فالعلامة غير موضوعة."
        },
        {
          id: "submit", title: "Submit", titleAr: "الإرسال", controlKey: "submit", risk: "confirm", last: true,
          instruction: "This is the final Submit button. Only you press it; the guide never will. On this mock site it only shows a page saying nothing was sent.",
          instructionAr: "هذا زر الإرسال النهائي. أنت وحدك تضغط عليه ولن يضغطه المرشد. في هذا الموقع التجريبي تظهر فقط صفحة تقول إن شيئًا لم يُرسَل.",
          pitfalls: ["Check the premise number once more: a wrong premise opens the account on the wrong property."],
          tipAr: "راجع رقم العقار مرة أخرى: الرقم الخاطئ يفتح الحساب على عقار آخر."
        }
      ]
    }
  ],
  riskPolicy: [
    { match: "submit|pay|confirm|approve|send|agree|direct debit", level: "confirm" },
    { match: "delete|remove|cancel", level: "confirm" }
  ]
};
