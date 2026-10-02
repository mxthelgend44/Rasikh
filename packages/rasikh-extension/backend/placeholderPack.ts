// backend/placeholderPack.ts
// PLACEHOLDER. A tiny skillpack for the local mock portal so the guide runs before X2's real packs
// land. It is not guidance for any real website.
import type { SkillPack } from "../src/shared/types";

export const placeholderPack: SkillPack = {
  id: "placeholder-portal",
  name: "Placeholder portal (mock)",
  nameAr: "بوابة تجريبية (محاكاة)",
  status: "mock",
  version: "0.0.1",
  urlPatterns: ["http://localhost:8793/*", "http://127.0.0.1:8793/*"],
  allowedDomains: ["localhost", "127.0.0.1"],
  views: {
    start: {
      signature: [],
      controls: [
        { key: "start", selectors: [{ kind: "roleName", value: "button|start|begin|apply" }] },
        { key: "name-field", selectors: [{ kind: "roleName", value: "textbox|name" }] },
        { key: "submit", selectors: [{ kind: "roleName", value: "button|submit|send|confirm" }] }
      ]
    }
  },
  glossary: { mock: "A local practice page. Nothing you do here is sent anywhere." },
  tasks: [
    {
      id: "demo-walkthrough",
      title: "Placeholder walkthrough",
      titleAr: "جولة تجريبية",
      steps: [
        { id: "start", title: "Start", titleAr: "ابدأ", instruction: "Find the start button.", instructionAr: "ابحث عن زر البدء.", controlKey: "start", risk: "safe" },
        { id: "name", title: "Your name", titleAr: "اسمك", instruction: "Find the name field. You type it yourself.", instructionAr: "ابحث عن حقل الاسم. اكتبه بنفسك.", controlKey: "name-field", risk: "safe" },
        { id: "submit", title: "Review and submit", titleAr: "المراجعة والإرسال", instruction: "Read what you entered. When you are sure, you press submit yourself.", instructionAr: "راجع ما أدخلته. عندما تتأكد، اضغط إرسال بنفسك.", controlKey: "submit", risk: "confirm", last: true }
      ]
    }
  ],
  riskPolicy: []
};
