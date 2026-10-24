import { requireSession } from '@/lib/auth';
import { getClinicTypes } from '@/lib/data';
import { NewClinicForm } from './new-form';

export default async function NewClinicPage() {
  const session = await requireSession();
  const clinicTypes = await getClinicTypes(session.userId);
  return <NewClinicForm clinicTypes={clinicTypes} />;
}