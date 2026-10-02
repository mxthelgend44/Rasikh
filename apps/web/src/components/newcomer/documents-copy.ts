import type { ExtractedField, Locale, RelocationDocument } from '@/domain/types';
import { formatAed, formatDate } from '@/lib/format';
import { intlTag, type MessageKey, type Translate } from '@/lib/i18n';

const en = {
  intro: 'Keep your documents together and review the details used in your demo roadmap.',
  demo: 'Demo extraction',
  demoHint:
    'Suggestions come from your hire profile, including sample document numbers and dates. No AI reads the selected file.',
  fileHint:
    'PDF, JPEG or PNG · up to 10 MiB. Demo previews save the file name and suggested fields. File contents stay on your device unless you choose live processing.',
  add: 'Create demo preview',
  adding: 'Saving demo preview',
  selected: 'Selected file',
  noFile: 'Choose a file before creating a preview.',
  emptyFile: 'This file is empty. Choose a PDF, JPEG or PNG with content.',
  invalidType: 'Choose a PDF, JPEG or PNG file.',
  invalidSize: 'This file exceeds 10 MiB. Choose a smaller file.',
  required: 'Documents to get started',
  progress: '{done} of {total} sets of details confirmed',
  extra: 'Other documents',
  review: 'Review details',
  view: 'View details',
  reviewTitle: 'Review your {kind}',
  reviewHint:
    'Check each suggestion against your document. Demo confidence scores are illustrative and do not measure this file.',
  original: 'Original value',
  edit: 'Edit {field}',
  finishEditing: 'Done editing',
  confidence: 'Demo confidence: {score}',
  corrected: 'Your correction · no extraction confidence',
  confirmation: 'I reviewed these details against my document and confirm them for this demo.',
  confirm: 'Confirm demo details',
  confirming: 'Saving confirmation',
  confirmed: 'Details confirmed in the demo.',
  saved: 'Demo preview saved. Review it before confirming.',
  close: 'Close',
  cancel: 'Review later',
  savingFailed: 'The demo preview could not be saved. Try again.',
  reviewFailed: 'Your confirmation could not be saved. Your edits are still here; try again.',
  stale: 'This document changed in another view. Close and reopen its details before confirming.',
  missingPerson: 'No newcomer is available. Add a hire from the employer view to start.',
  requiredValue: 'Enter a value for this field.',
  tooLong: 'Use no more than 500 characters.',
  correctionHint: 'Use the exact value from your document. Dates use YYYY-MM-DD.',
  statusUploaded: 'Awaiting demo review',
  statusExtracted: 'Ready to review',
  statusVerified: 'Confirmed in demo',
  statusRejected: 'New copy needed',
  rejection:
    'This seeded demo record needs a new copy. Choose a file above to create a replacement preview.',
  fixtureReason: 'Seeded demo note',
  confirmedHint:
    'This confirmation records your review in the demo. It does not authenticate the file or prove its validity.',
  monthlySalary: '{amount} a month (est.)',
  noFields: 'No field suggestions are available for this demo record.',
  emptyHint: 'Start with your passport, offer letter and degree certificate.',
  changedPerson:
    'The selected newcomer changed. Close this review and open the current person’s document.',
  live: 'AI extraction · Vertex',
  liveButton: 'Process with Vertex AI',
  liveBusy: 'Processing with Vertex AI',
  liveDisclosure:
    'This optional action sends this file to Vertex AI for extraction. Only continue if you want the provider to process its contents.',
  liveConsent: 'I agree to send this file to Vertex AI for extraction.',
  liveUnavailable: 'Live extraction is unavailable. Demo previews remain available.',
  liveNotSupported: 'Live extraction is unavailable for this document type.',
  liveFailed:
    'Live extraction did not complete. Nothing was replaced with a demo result. Try again or choose a demo preview.',
  liveSaveFailed:
    'Vertex returned suggestions, but they could not be saved. Try the extraction again.',
  liveResult:
    'These suggestions came from Vertex AI. Check every value against your document before confirming.',
  liveReviewHint:
    'Review the extracted suggestions. The provider does not supply field confidence scores.',
  noConfidence: 'Extraction confidence not provided',
  liveFileHint:
    'File contents remain on your device unless you explicitly choose Vertex AI processing below.',
  liveConfirmedHint:
    'Your confirmation records your review. It does not authenticate the file or prove its validity.',
  liveStatusVerified: 'Details confirmed',
  liveModel: 'Provider model: {model}',
  reviewedAt: 'Reviewed {date}',
  unavailableValue: 'Not extracted — enter the value from your document',
  liveConfirmation: 'I reviewed these details against my document and confirm them.',
  liveConfirm: 'Confirm details',
  liveConfirmed: 'Your review and confirmed details were saved.',
  liveRejection:
    'This record needs a new copy. Select a file above to create a replacement extraction.',
  liveReason: 'Provider explanation',
  liveSize: 'Vertex AI processing accepts files up to 4 MiB.',
  liveSizeError:
    'This file exceeds the 4 MiB live extraction limit. Choose a smaller file or use a demo preview.',
  fieldOfStudy: 'Field of study',
  awardDate: 'Award date',
} as const;

const ar: Record<keyof typeof en, string> = {
  intro: 'اجمع مستنداتك وراجع البيانات المستخدمة في خارطة الطريق التجريبية.',
  demo: 'استخراج تجريبي',
  demoHint:
    'تأتي الاقتراحات من ملف الموظف، بما فيها أرقام مستندات وتواريخ نموذجية. لا يقرأ الذكاء الاصطناعي الملف المختار.',
  fileHint:
    'ملف PDF أو JPEG أو PNG · بحد أقصى 10 ميبيبايت. تحفظ المعاينة التجريبية اسم الملف والحقول المقترحة. ويبقى المحتوى على جهازك ما لم تختر المعالجة الفعلية.',
  add: 'أنشئ معاينة تجريبية',
  adding: 'جارٍ حفظ المعاينة التجريبية',
  selected: 'الملف المختار',
  noFile: 'اختر ملفًا قبل إنشاء المعاينة.',
  emptyFile: 'هذا الملف فارغ. اختر ملف PDF أو JPEG أو PNG يحتوي على بيانات.',
  invalidType: 'اختر ملف PDF أو JPEG أو PNG.',
  invalidSize: 'يتجاوز حجم هذا الملف 10 ميبيبايت. اختر ملفًا أصغر.',
  required: 'مستندات البدء',
  progress: 'تم تأكيد بيانات {done} من {total} مستندات',
  extra: 'مستندات أخرى',
  review: 'راجع البيانات',
  view: 'اعرض البيانات',
  reviewTitle: 'راجع {kind}',
  reviewHint: 'قارن كل اقتراح بمستندك. درجات الثقة تجريبية ولا تقيس دقة قراءة هذا الملف.',
  original: 'القيمة الأصلية',
  edit: 'عدّل {field}',
  finishEditing: 'تم التعديل',
  confidence: 'درجة الثقة التجريبية: {score}',
  corrected: 'تصحيحك · لا توجد درجة ثقة للاستخراج',
  confirmation: 'راجعت هذه البيانات بمقارنتها بمستندي وأؤكدها لهذا العرض التجريبي.',
  confirm: 'أكّد البيانات التجريبية',
  confirming: 'جارٍ حفظ التأكيد',
  confirmed: 'تم تأكيد البيانات في العرض التجريبي.',
  saved: 'حُفظت المعاينة التجريبية. راجعها قبل التأكيد.',
  close: 'أغلق',
  cancel: 'راجع لاحقًا',
  savingFailed: 'تعذّر حفظ المعاينة التجريبية. حاول مرة أخرى.',
  reviewFailed: 'تعذّر حفظ تأكيدك. ما زالت تعديلاتك موجودة؛ حاول مرة أخرى.',
  stale: 'تغيّر هذا المستند في واجهة أخرى. أغلق بياناته وافتحها مجددًا قبل التأكيد.',
  missingPerson: 'لا يوجد وافد لعرضه. أضف موظفًا من واجهة صاحب العمل للبدء.',
  requiredValue: 'أدخل قيمة لهذا الحقل.',
  tooLong: 'استخدم 500 حرف كحد أقصى.',
  correctionHint: 'استخدم القيمة كما وردت في مستندك. تُكتب التواريخ بالصيغة YYYY-MM-DD.',
  statusUploaded: 'بانتظار المراجعة التجريبية',
  statusExtracted: 'جاهز للمراجعة',
  statusVerified: 'مؤكد في العرض التجريبي',
  statusRejected: 'تلزم نسخة جديدة',
  rejection: 'يحتاج هذا السجل التجريبي إلى نسخة جديدة. اختر ملفًا أعلاه لإنشاء معاينة بديلة.',
  fixtureReason: 'ملاحظة من بيانات العرض التجريبي',
  confirmedHint: 'يسجّل هذا التأكيد مراجعتك في العرض التجريبي. ولا يوثّق الملف أو يثبت صحته.',
  monthlySalary: '{amount} شهريًا (تقديري)',
  noFields: 'لا توجد اقتراحات حقول لهذا السجل التجريبي.',
  emptyHint: 'ابدأ بجواز سفرك وخطاب العرض والشهادة الجامعية.',
  changedPerson: 'تغيّر الوافد المختار. أغلق هذه المراجعة وافتح مستند الشخص الحالي.',
  live: 'استخراج بالذكاء الاصطناعي · Vertex',
  liveButton: 'عالج الملف عبر Vertex AI',
  liveBusy: 'جارٍ المعالجة عبر Vertex AI',
  liveDisclosure:
    'يرسل هذا الإجراء الاختياري الملف إلى Vertex AI لاستخراج بياناته. تابع فقط إذا أردت أن يعالج المزوّد محتواه.',
  liveConsent: 'أوافق على إرسال هذا الملف إلى Vertex AI لاستخراج بياناته.',
  liveUnavailable: 'الاستخراج الفعلي غير متاح. ما زالت المعاينات التجريبية متاحة.',
  liveNotSupported: 'الاستخراج الفعلي غير متاح لهذا النوع من المستندات.',
  liveFailed:
    'لم يكتمل الاستخراج الفعلي. لم تُستبدل النتيجة ببيانات تجريبية. حاول مرة أخرى أو اختر معاينة تجريبية.',
  liveSaveFailed: 'أعاد Vertex اقتراحات، لكن تعذّر حفظها. حاول الاستخراج مرة أخرى.',
  liveResult: 'تأتي هذه الاقتراحات من Vertex AI. قارن كل قيمة بمستندك قبل التأكيد.',
  liveReviewHint: 'راجع البيانات المستخرجة. لا يوفّر المزوّد درجات ثقة لكل حقل.',
  noConfidence: 'لم تُقدّم درجة ثقة للاستخراج',
  liveFileHint: 'يبقى محتوى الملف على جهازك ما لم تختر صراحةً المعالجة عبر Vertex AI أدناه.',
  liveConfirmedHint: 'يسجّل تأكيدك مراجعتك. ولا يوثّق الملف أو يثبت صحته.',
  liveStatusVerified: 'تم تأكيد البيانات',
  liveModel: 'نموذج المزوّد: {model}',
  reviewedAt: 'تمت المراجعة في {date}',
  unavailableValue: 'لم تُستخرج القيمة — أدخلها كما وردت في مستندك',
  liveConfirmation: 'راجعت هذه البيانات بمقارنتها بمستندي وأؤكدها.',
  liveConfirm: 'أكّد البيانات',
  liveConfirmed: 'حُفظت مراجعتك والبيانات التي أكّدتها.',
  liveRejection: 'يحتاج هذا السجل إلى نسخة جديدة. اختر ملفًا أعلاه لإنشاء استخراج بديل.',
  liveReason: 'تفسير المزوّد',
  liveSize: 'تقبل المعالجة عبر Vertex AI ملفات بحد أقصى 4 ميبيبايت.',
  liveSizeError:
    'يتجاوز هذا الملف الحد الأقصى للاستخراج الفعلي وهو 4 ميبيبايت. اختر ملفًا أصغر أو استخدم المعاينة التجريبية.',
  fieldOfStudy: 'التخصص الدراسي',
  awardDate: 'تاريخ منح الشهادة',
};

export type DocumentsCopyKey = keyof typeof en;

export function documentsCopy(
  locale: Locale,
  key: DocumentsCopyKey,
  params?: Record<string, string | number>,
): string {
  const template: string = (locale === 'ar' ? ar : en)[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params?.[name] === undefined ? match : String(params[name]),
  );
}

export function documentStatus(
  status: RelocationDocument['status'],
  locale: Locale,
  source?: RelocationDocument['source'],
): string {
  if (source === 'vertex' && status === 'verified')
    return documentsCopy(locale, 'liveStatusVerified');
  const keys = {
    uploaded: 'statusUploaded',
    extracted: 'statusExtracted',
    verified: 'statusVerified',
    rejected: 'statusRejected',
  } as const;
  return documentsCopy(locale, keys[status]);
}

const FIELD_KEYS = new Set([
  'name',
  'number',
  'nationality',
  'dob',
  'expiry',
  'employer',
  'role',
  'salary',
  'start',
  'institution',
  'qualification',
  'year',
]);

const FIELD_ALIASES: Record<string, string> = {
  full_name: 'name',
  passport_number: 'number',
  date_of_birth: 'dob',
  expiry_date: 'expiry',
  employer_name: 'employer',
  job_title: 'role',
  salary_aed: 'salary',
  start_date: 'start',
  institution_name: 'institution',
  degree: 'qualification',
  graduation_year: 'year',
};

export function documentFieldLabel(field: ExtractedField, t: Translate, locale: Locale): string {
  if (field.key === 'field') return documentsCopy(locale, 'fieldOfStudy');
  if (field.key === 'award_date') return documentsCopy(locale, 'awardDate');
  const key = FIELD_ALIASES[field.key] ?? field.key;
  return FIELD_KEYS.has(key) ? t(`documents.field.${key}` as MessageKey) : field.label;
}

const ARABIC_VALUES: Record<string, string> = {
  Nigerian: 'نيجيرية',
  Singaporean: 'سنغافورية',
  Brazilian: 'برازيلية',
  Swedish: 'سويدية',
  Georgian: 'جورجية',
  Indian: 'هندية',
  Egyptian: 'مصرية',
  Polish: 'بولندية',
  'South African': 'جنوب أفريقية',
  German: 'ألمانية',
  British: 'بريطانية',
  French: 'فرنسية',
  Pakistani: 'باكستانية',
  Filipino: 'فلبينية',
  Lebanese: 'لبنانية',
  Jordanian: 'أردنية',
  'QA engineer': 'مهندس ضمان الجودة',
  'Data scientist': 'عالم بيانات',
  'Cloud engineer': 'مهندس الحوسبة السحابية',
  'Solutions architect': 'مهندس تصميم الحلول',
  'Product designer': 'مصمم منتجات',
  'DevOps engineer': 'مهندس التطوير والعمليات',
  'Finance analyst': 'محلل مالي',
  'Backend engineer': 'مهندس الأنظمة الخلفية',
  'Graduate analyst': 'محلل حديث التخرج',
  'Software engineer': 'مهندس برمجيات',
  'Senior software engineer': 'مهندس برمجيات أول',
  'Bachelor of Science': 'بكالوريوس العلوم',
  'BSc Computer Science': 'بكالوريوس العلوم في علوم الحاسوب',
  'MSc Data Science': 'ماجستير العلوم في علم البيانات',
  'BEng Computer Engineering': 'بكالوريوس هندسة الحاسوب',
  'MSc Computer Science': 'ماجستير العلوم في علوم الحاسوب',
  'BA Visual Communication': 'بكالوريوس الاتصال البصري',
  'BTech Information Technology': 'بكالوريوس التقنية في تكنولوجيا المعلومات',
  'BBA Accounting': 'بكالوريوس إدارة الأعمال في المحاسبة',
  'BCom Information Systems': 'بكالوريوس التجارة في نظم المعلومات',
  'University of Lagos': 'جامعة لاغوس',
  'Nanyang Technological University': 'جامعة نانيانغ التكنولوجية',
  'University of São Paulo': 'جامعة ساو باولو',
  'KTH Royal Institute of Technology': 'المعهد الملكي للتكنولوجيا',
  'Tbilisi State Academy of Arts': 'أكاديمية تبليسي الحكومية للفنون',
  'College of Engineering Pune': 'كلية الهندسة في بونه',
  'American University in Cairo': 'الجامعة الأمريكية بالقاهرة',
  'AGH University of Krakow': 'جامعة إيه جي إتش في كراكوف',
  'University of the Witwatersrand': 'جامعة ويتواترسراند',
  'University of Kraków': 'جامعة كراكوف',
  'University of Cairo': 'جامعة القاهرة',
  'University of Pune': 'جامعة بونه',
  'University of Tbilisi': 'جامعة تبليسي',
  'University of Stockholm': 'جامعة ستوكهولم',
  'University of Singapore': 'جامعة سنغافورة',
  'University of Johannesburg': 'جامعة جوهانسبرغ',
};

/** Format known demo values; unknown text retains the exact original with a visible label. */
export function documentFieldValue(
  field: ExtractedField,
  locale: Locale,
): { value: string; original: boolean } {
  const key = FIELD_ALIASES[field.key] ?? field.key;
  if (
    ['dob', 'expiry', 'start', 'award_date'].includes(key) &&
    /^\d{4}-\d{2}-\d{2}$/.test(field.value) &&
    Number.isFinite(Date.parse(field.value))
  ) {
    return { value: formatDate(field.value, locale), original: false };
  }
  if (key === 'salary') {
    const match = field.value.match(/^AED\s+([\d,]+)(?:\.\d+)?(?:\s+a month(?:\s+\(est\.\))?)?$/);
    if (match)
      return {
        value: documentsCopy(locale, 'monthlySalary', {
          amount: formatAed(Number(match[1].replaceAll(',', '')), locale),
        }),
        original: false,
      };
  }
  if (key === 'year' && /^\d{4}$/.test(field.value)) {
    return {
      value: new Intl.NumberFormat(intlTag(locale), { useGrouping: false }).format(
        Number(field.value),
      ),
      original: false,
    };
  }
  if (locale === 'ar' && ARABIC_VALUES[field.value])
    return { value: ARABIC_VALUES[field.value], original: false };
  return {
    value: field.value,
    original: locale === 'ar' && /[a-zA-Z]/.test(field.value) && key !== 'number',
  };
}

export function documentReasoning(value: string, locale: Locale): string {
  if (locale === 'en') return value;
  const translations: Record<string, string> = {
    'The certificate has no attestation stamp. The visa application needs an attested copy.':
      'الشهادة بلا ختم تصديق. يحتاج طلب التأشيرة إلى نسخة مصدّقة.',
    'The name matches your offer letter, and the passport is valid for well over six months.':
      'الاسم مطابق لخطاب العرض، ومدة صلاحية جواز السفر تتجاوز ستة أشهر.',
    'The employer and role match the Rasikh hire record, and the letter is signed.':
      'صاحب العمل والمسمى الوظيفي مطابقان لسجل الموظف في راسخ، والخطاب موقّع.',
    'The degree matches the role requirements and the name matches the passport.':
      'الشهادة مطابقة لمتطلبات الوظيفة، والاسم مطابق لجواز السفر.',
  };
  return translations[value] ?? documentsCopy(locale, 'demoHint');
}
