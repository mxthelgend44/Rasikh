'use client';

import { Badge } from '@/components/ui/badge';
import { Panel, useEmployerCopy } from './common';
import verification from './current-guard-evidence.json';

export function CurrentGuardEvidence() {
  const { e: translate, locale } = useEmployerCopy();
  const totals = verification.totals;
  const measuredTime = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Dubai',
  });
  return (
    <Panel
      title={translate('Deployed Guard · dated HTTP checks', 'الحماية المنشورة · تحقق HTTP مؤرخ')}
      description={translate(
        'A separate measurement snapshot, not a live monitor or a full-app security certification.',
        'لقطة قياس مستقلة، وليست مراقبة مباشرة أو اعتماداً أمنياً للتطبيق بالكامل.',
      )}
      action={
        <Badge tone={verification.status === 'pass' ? 'success' : 'warning'} shape="pill">
          {verification.status === 'pass'
            ? translate('Passed · HTTP scope only', 'نجح · نطاق HTTP فقط')
            : translate('Review measured scope', 'راجع نطاق القياس')}
        </Badge>
      }
    >
      <div className="space-y-3 border-b border-line p-5">
        <p className="text-label leading-6 text-fg-secondary">
          {translate('Measured window · Dubai time', 'فترة القياس · بتوقيت دبي')}:{' '}
          <time dateTime={verification.startedAt}>
            {measuredTime.format(new Date(verification.startedAt))}
          </time>
          {' → '}
          <time dateTime={verification.completedAt}>
            {measuredTime.format(new Date(verification.completedAt))}
          </time>
        </p>
        <p className="text-label leading-6 text-fg-secondary">
          {translate('Wire contract', 'إصدار عقد الاتصال')}: <bdi>{verification.wireContract}</bdi> ·{' '}
          {translate('Deployment revision', 'نسخة النشر')}: <bdi>{verification.deployment.revision}</bdi>
        </p>
        <p className="text-label leading-6 text-fg-secondary">
          {translate(
            `${verification.runs.length} runs of the same ${verification.runs[0].attacks} unchanged synthetic attack fixtures. These are repetitions, not independent cohorts.`,
            `${verification.runs.length} تجارب للبيانات الاصطناعية نفسها وعددها ${verification.runs[0].attacks} دون تغيير. هذه تكرارات، وليست مجموعات مستقلة.`,
          )}
        </p>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        <div>
          <p className="text-caption text-fg-tertiary">
            {translate('Verified attack denials', 'رفض الهجمات الموثق')}
          </p>
          <p className="mt-2 text-[2rem] font-medium">
            {totals.verified_denials} / {totals.attack_attempts}
          </p>
          <p className="mt-2 text-label leading-6 text-fg-secondary">
            {translate('Actual HTTP authorization checks', 'عمليات تحقق تفويض فعلية عبر HTTP')}
          </p>
        </div>
        <div>
          <p className="text-caption text-fg-tertiary">
            {translate('Explicit forbidden allows', 'سماحات صريحة لمسارات محظورة')}
          </p>
          <p className="mt-2 text-[2rem] font-medium">{totals.explicit_allows}</p>
          <p className="mt-2 text-label leading-6 text-fg-secondary">
            {translate(`${totals.attack_errors} attack errors`, `${totals.attack_errors} أخطاء هجمات`)}
          </p>
        </div>
        <div>
          <p className="text-caption text-fg-tertiary">
            {translate('Conformance checks passed', 'عمليات مطابقة العقد الناجحة')}
          </p>
          <p className="mt-2 text-[2rem] font-medium">{totals.conformance_passed}</p>
          <p className="mt-2 text-label leading-6 text-fg-secondary">
            {translate(
              `${totals.conformance_failed} failed · ${totals.conformance_errors} errors · ${totals.conformance_skipped} skipped`,
              `${totals.conformance_failed} فشل · ${totals.conformance_errors} أخطاء · ${totals.conformance_skipped} تخطٍ`,
            )}
          </p>
        </div>
      </div>
      <div className="space-y-4 border-t border-line p-5">
        <p className="text-body leading-6 text-fg-secondary">
          {translate(
            'No recipient payload was forwarded. No model or Vertex calls were made. The shared-service reset probe was skipped once per run; service-tag and remedies extensions were not exercised.',
            'لم يُرسل أي محتوى إلى جهة مستقبلة. لم تُجرَ استدعاءات للنموذج أو Vertex. تم تخطي اختبار إعادة ضبط الخدمة المشتركة مرة في كل تجربة، ولم تُختبر إضافات وسوم الخدمة أو إجراءات المعالجة.',
          )}
        </p>
        <p className="rounded-xl bg-warning-soft p-4 text-label leading-6 text-warning">
          {translate(
            'Current-app full security, end-to-end exfiltration and the live Vertex benchmark were not measured. The archived Trust snapshot remains failed and incomplete; production app prompt parity remains unverified.',
            'لم يُقَس أمن التطبيق الحالي بالكامل أو تسريب البيانات من البداية إلى النهاية أو تقييم Vertex المباشر. تظل لقطة الثقة المؤرشفة فاشلة وغير مكتملة؛ وتطابق تعليمات تطبيق الإنتاج غير موثق.',
          )}
        </p>
        <details className="rounded-xl border border-line p-4">
          <summary className="cursor-pointer text-label font-medium text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {translate('Inspect measured source and run labels', 'فحص مصدر القياس وبيانات التجارب')}
          </summary>
          <dl className="mt-4 space-y-4 text-label">
            <div>
              <dt className="text-fg-tertiary">{translate('Frozen source', 'المصدر المثبت')}
              </dt>
              <dd className="mt-1 break-all font-mono text-caption">
                <bdi>{verification.source.path}</bdi>
              </dd>
              <dd className="mt-2 break-all font-mono text-caption">
                SHA-256: <bdi>{verification.source.sha256}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-fg-tertiary">{translate('Upstream commit', 'النسخة المرجعية')}
              </dt>
              <dd className="mt-1 break-all font-mono text-caption">
                <bdi>{verification.upstream}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-fg-tertiary">
                {translate('Recorded run timestamps · UTC', 'أوقات التجارب المسجلة · UTC')}
              </dt>
              <dd className="mt-1 space-y-1 font-mono text-caption">
                {verification.runs.map((run) => (
                  <p key={run.run}>
                    {run.run}: <time dateTime={run.generatedAt}><bdi>{run.generatedAt}</bdi></time>
                  </p>
                ))}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-label leading-6 text-fg-secondary">
            {translate(
              `Revision metadata was supplied by the deployment handoff, not an independent revision lookup. Observed health verified the wire contract and upstream commit. Access was through an authenticated proxy to a private Cloud Run service. The report records ${verification.archivedEvidence.fileCount} archived evidence files unchanged.`,
              `قدمت جهة تنسيق النشر بيانات النسخة، ولم تُتحقق منها عبر بحث مستقل. أثبت فحص الخدمة عقد الاتصال والنسخة المرجعية. تم الوصول عبر وسيط موثق إلى خدمة Cloud Run خاصة. يسجل التقرير بقاء ${verification.archivedEvidence.fileCount} ملف أدلة مؤرشفاً دون تغيير.`,
            )}
          </p>
        </details>
      </div>
    </Panel>
  );
}
