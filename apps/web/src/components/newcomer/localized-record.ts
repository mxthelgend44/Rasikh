import type { Locale } from '@/domain/types';

/** Translate known demo values; names and user-authored text remain in their original form. */
const ARABIC_VALUES: Record<string, string> = {
  'QA engineer': 'مهندس ضمان الجودة',
  'Data scientist': 'عالم بيانات',
  'Cloud engineer': 'مهندس سحابة',
  'Solutions architect': 'مهندس حلول',
  'Product designer': 'مصمم منتجات',
  'DevOps engineer': 'مهندس تطوير وعمليات',
  'Finance analyst': 'محلل مالي',
  'Software engineer': 'مهندس برمجيات',
  'Senior software engineer': 'مهندس برمجيات أول',
  'Backend engineer': 'مهندس أنظمة خلفية',
  'Graduate analyst': 'محلل حديث التخرج',
  'Al Reem Island': 'جزيرة الريم',
  'Al Maryah Island': 'جزيرة المارية',
  'Al Raha Beach': 'شاطئ الراحة',
  'Khalifa City': 'مدينة خليفة',
  'Mohammed Bin Zayed City': 'مدينة محمد بن زايد',
  'Saadiyat Island': 'جزيرة السعديات',
  'Yas Island': 'جزيرة ياس',
  'the immigration authority (ICP)': 'الهيئة الاتحادية للهوية والجنسية (ICP)',
  'Abu Dhabi Municipality': 'بلدية أبوظبي',
  'the bank': 'البنك',
  'the landlord': 'المالك',
  'your employer': 'جهة عملك',
  'The degree certificate is not attested, so the visa application cannot be submitted.':
    'شهادة المؤهل غير مصدّقة، لذلك لا يمكن تقديم طلب الإقامة.',
  'Salary details can only be shared with landlords as a yes or no result.':
    'تسمح سياسة العرض بمشاركة نتيجة القدرة على الدفع فقط مع المالك، دون تفاصيل الراتب.',
  'Your passport has not been shared with landlords yet.':
    'لم تمنح إذن مشاركة جواز السفر مع المالك بعد.',
  'You allowed your passport and salary for banks.':
    'يتضمن سجل العرض إذناً بمشاركة جواز السفر والراتب مع البنك.',
  'Passport and Emirates ID application can be shared with government services.':
    'تسمح سياسة العرض بمشاركة جواز السفر وطلب الهوية مع الخدمات الحكومية.',
  'Documents may be sent for extraction only. Nothing else leaves with them.':
    'يسجّل هذا المثال سماحاً باستخدام المستندات للاستخراج فقط. وهو ليس دليلاً على إرسال فعلي.',
  'You allowed your passport for landlords, and the rest is an employment letter and a yes or no affordability result.':
    'يسجّل المثال إذناً لجواز السفر، مع خطاب العمل ونتيجة القدرة على الدفع فقط.',
};

export function localizedRecord(value: string, locale: Locale): string {
  if (locale === 'en') return value;
  const document =
    /^Your (passport|offer letter|degree certificate|residence visa|Emirates ID|tenancy contract|salary certificate|bank statement) needs review$/.exec(
      value,
    );
  if (document) {
    const names: Record<string, string> = {
      passport: 'جواز السفر',
      'offer letter': 'خطاب عرض العمل',
      'degree certificate': 'شهادة المؤهل',
      'residence visa': 'الإقامة',
      'Emirates ID': 'الهوية الإماراتية',
      'tenancy contract': 'عقد الإيجار',
      'salary certificate': 'شهادة الراتب',
      'bank statement': 'كشف الحساب',
    };
    return `يحتاج مستند ${names[document[1]]} إلى مراجعتك.`;
  }
  return ARABIC_VALUES[value] ?? value;
}

export function translatedRecord(value: string, locale: Locale): boolean {
  return (
    locale === 'en' || localizedRecord(value, locale) !== value || /[\u0600-\u06ff]/.test(value)
  );
}
