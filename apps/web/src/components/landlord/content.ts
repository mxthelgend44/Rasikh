import type { Locale } from '@/domain/types';

/** Translations of the fixed illustrative records. User-authored notes keep their original text. */
const arabic: Record<string, string> = {
  'Moderate risk, mainly because rent is high against income. Employer backing offsets most of it.':
    'مخاطر متوسطة، يعود معظمها إلى ارتفاع الإيجار مقارنة بالدخل. يخفف دعم جهة العمل من معظم هذه المخاطر.',
  'Low risk. Income comfortably covers the rent and the employer backs the hire.':
    'مخاطر منخفضة. يغطي الدخل الإيجار بشكل مريح، ويحظى الموظف بدعم جهة العمل.',
  'Employer backing': 'دعم جهة العمل',
  'Rent against income': 'الإيجار مقارنة بالدخل',
  Documents: 'المستندات',
  'Residence visa': 'تأشيرة الإقامة',
  Cheques: 'الشيكات',
  'Gulf Meridian Technologies has backed this application, which lowers the chance of a missed payment.':
    'دعمت Gulf Meridian Technologies هذا الطلب، مما يقلل احتمال التأخر في السداد.',
  'Affordability is a yes, but with a narrow margin: the rent is high for the recorded income. Only the yes or no result is shared, not the salary.':
    'نتيجة القدرة على السداد إيجابية لكن بهامش ضيق: الإيجار مرتفع قياسًا بالدخل المسجل. تُشارك النتيجة (نعم أو لا) فقط، وليس الراتب.',
  'Passport, offer letter and degree were read and cross-checked. Names and dates agree.':
    'قُرئت بيانات جواز السفر وعرض العمل والشهادة وقورنت. تتطابق الأسماء والتواريخ.',
  'The visa is still being processed, so the lease start should follow its issue date.':
    'لا تزال التأشيرة قيد المعالجة، لذا ينبغي أن يبدأ الإيجار بعد إصدارها.',
  'Two cheques were requested. Four would spread the payments and reduce the risk.':
    'طُلب السداد بشيكين. يوزع السداد بأربعة شيكات الدفعات ويخفف المخاطر.',
  'Gulf Meridian Technologies has backed this application.':
    'دعمت Gulf Meridian Technologies هذا الطلب.',
  'Affordability is a yes with a comfortable margin. Only the yes or no result is shared, not the salary.':
    'نتيجة القدرة على السداد إيجابية بهامش مريح. تُشارك النتيجة (نعم أو لا) فقط، وليس الراتب.',
  'Passport, offer letter and degree were verified and agree with each other.':
    'تم التحقق من جواز السفر وعرض العمل والشهادة وتطابق بياناتها.',
  'Salary details can only be shared with landlords as a yes or no result.':
    'لا يمكن مشاركة تفاصيل الراتب مع المالك إلا كنتيجة بنعم أو لا.',
  'Your passport has not been shared with landlords yet.':
    'لم تُشارك بيانات جواز السفر مع المالك بعد.',
  'You allowed your passport for landlords, and the rest is an employment letter and a yes or no affordability result.':
    'وافقت على مشاركة جواز السفر مع المالك. وتشمل المعلومات الأخرى خطاب التوظيف ونتيجة بنعم أو لا للقدرة على تحمل الإيجار.',
  'Approved on the terms shown.': 'تم الاعتماد وفق الشروط المعروضة.',
};

export function recordText(value: string, locale: Locale) {
  return locale === 'ar' ? (arabic[value] ?? value) : value;
}
