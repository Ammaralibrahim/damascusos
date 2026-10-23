import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { getClinic } from '@/lib/data';
import { EditForm } from './edit-form';

export default async function EditClinicPage({
  params,
}: {
  params: { id: string };
}) {
  const clinic = await getClinic(params.id);
  if (!clinic) notFound();

  const initial = {
    name: clinic.name,
    doctorName: clinic.doctorName ?? '',
    city: clinic.city ?? '',
    area: clinic.area ?? '',
    phone: clinic.phone ?? '',
    website: clinic.website ?? '',
    social: clinic.social ?? '',
    source: clinic.source ?? '',
    notes: clinic.notes ?? '',
    hasWebsite: (clinic.digital?.hasWebsite ?? 'unknown') as
      | 'yes'
      | 'no'
      | 'unknown',
    mobileFriendly: (clinic.digital?.mobileFriendly ?? 'unknown') as
      | 'yes'
      | 'no'
      | 'unknown',
    servicesClear: (clinic.digital?.servicesClear ?? 'unknown') as
      | 'yes'
      | 'no'
      | 'unknown',
    basicInfoPresent: (clinic.digital?.basicInfoPresent ?? 'unknown') as
      | 'yes'
      | 'no'
      | 'unknown',
    bookingPresent: (clinic.digital?.bookingPresent ?? 'unknown') as
      | 'yes'
      | 'no'
      | 'unknown',
    contactClear: (clinic.digital?.contactClear ?? 'unknown') as
      | 'yes'
      | 'no'
      | 'unknown',
    observedIssue: clinic.digital?.observedIssue ?? '',
    suggestedImprovement: clinic.digital?.suggestedImprovement ?? '',
    scoreProblem: clinic.scores?.problem ?? 0,
    scoreFit: clinic.scores?.fit ?? 0,
    scoreAccess: clinic.scores?.access ?? 0,
    scoreInterest: clinic.scores?.interest ?? 0,
    scoreNextStep: clinic.scores?.nextStep ?? 0,
    scoringComplete: Boolean(clinic.scores?.complete),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={
          <Link
            href={`/clinics/${params.id}`}
            className="inline-flex items-center gap-1 text-xs text-fg-tertiary transition-colors duration-fast hover:text-fg"
          >
            <ArrowRight size={12} strokeWidth={1.75} />
            {clinic.name}
          </Link>
        }
        overline="تعديل"
        title={`تعديل ${clinic.name}`}
        description="حدّث البيانات الأساسية، التقييم الرقمي، وتقييم فرصة البيع."
      />

      <EditForm clinicId={params.id} initial={initial} />
    </div>
  );
}