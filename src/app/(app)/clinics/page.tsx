import Link from 'next/link';
import { Plus, Search, X } from 'lucide-react';
import { Button, Empty } from '@/components/ui';
import { PageHeader } from '@/components/page-header';
import { listClinics } from '@/lib/data';
import { ClinicsListClient } from './clinics-list-client';

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: { q?: string; stage?: string };
}) {
  const clinics = await listClinics({ q: searchParams.q, stage: searchParams.stage });
  const hasFilter = Boolean(searchParams.q || searchParams.stage);

  return (
    <div className="space-y-6">
      <PageHeader
        overline="العيادات"
        title={
          <span className="tabular">
            {clinics.length} {clinics.length === 1 ? 'عيادة' : 'عيادات'}
          </span>
        }
        actions={
          <Link href="/clinics/new">
            <Button
              variant="primary"
              leadingIcon={<Plus size={15} strokeWidth={2} />}
            >
              إضافة
            </Button>
          </Link>
        }
      />

      <form className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            strokeWidth={1.75}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
          />
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="ابحث بالاسم أو الهاتف أو المنطقة"
            className="h-9 w-full rounded-md border border-line bg-input pr-9 pl-3 text-sm text-fg placeholder:text-fg-tertiary transition-[border-color,box-shadow] duration-fast hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <select
          name="stage"
          defaultValue={searchParams.stage ?? ''}
          className="h-9 rounded-md border border-line bg-input px-3 text-sm text-fg focus:border-accent focus:outline-none sm:w-40"
        >
          <option value="">كل المراحل</option>
          <option value="new">جديدة</option>
          <option value="verifying">قيد التحقق</option>
          <option value="qualified">مؤهلة</option>
          <option value="contacted">تم التواصل</option>
          <option value="awaiting_reply">بانتظار الرد</option>
          <option value="initial_interest">اهتمام مبدئي</option>
          <option value="discussing">مناقشة</option>
          <option value="demo">عرض تجريبي</option>
          <option value="quote">عرض سعر</option>
          <option value="negotiation">تفاوض</option>
          <option value="won">اتفاق</option>
          <option value="paid">مدفوع</option>
          <option value="not_interested">غير مهتم</option>
          <option value="future_followup">متابعة مستقبلية</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 text-sm font-medium text-fg shadow-1 transition-[background-color,border-color,transform] duration-fast hover:border-line-strong hover:bg-hover active:translate-y-px"
        >
          بحث
        </button>
        {hasFilter && (
          <Link
            href="/clinics"
            className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-line bg-surface-2 px-3 text-xs font-medium text-fg-secondary shadow-1 transition-colors duration-fast hover:bg-hover hover:text-fg"
          >
            <X size={13} strokeWidth={2} />
            إزالة
          </Link>
        )}
      </form>

      {clinics.length === 0 ? (
        <Empty
          title={hasFilter ? 'لا نتائج مطابقة' : 'لا عيادات بعد'}
          description={
            hasFilter
              ? 'جرّب كلمة بحث أخرى أو أزل المرشح.'
              : 'أضف أول عيادة لتبدأ مسار المبيعات.'
          }
          action={
            !hasFilter && (
              <Link href="/clinics/new">
                <Button variant="primary" size="sm">
                  إضافة عيادة
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <ClinicsListClient
          clinics={clinics.map((c) => ({
            _id: String(c._id),
            name: c.name,
            area: c.area ?? null,
            city: c.city ?? null,
            stage: c.stage,
            scores: c.scores,
          }))}
        />
      )}
    </div>
  );
}