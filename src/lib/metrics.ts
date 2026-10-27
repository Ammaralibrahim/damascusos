import 'server-only';
import { connectDb } from './db';
import { ClinicModel } from '@/models/Clinic';
import { InteractionModel } from '@/models/Interaction';
import { FollowUpModel } from '@/models/FollowUp';

export type DashboardMetrics = {
  totalClinics: number;
  activeClinics: number;
  outreachCount: number;
  positiveReplies: number;
  interested: number;
  demoPreparing: number;
  demoShared: number;
  quotesSent: number;
  paid: number;
  dueToday: number;
  overdue: number;
  conversionToInterest: number | null;
  conversionToPaid: number | null;
  hasEnoughDataForRates: boolean;
};

const INTEREST_AND_BEYOND = [
  'initial_interest',
  'discussing',
  'demo_preparing',
  'demo',
  'quote',
  'negotiation',
  'won',
  'paid',
];

const CONTACTED_AND_BEYOND = [
  'contacted',
  'awaiting_reply',
  'initial_interest',
  'discussing',
  'demo_preparing',
  'demo',
  'quote',
  'negotiation',
  'won',
  'paid',
  'not_interested',
];

const DEMO_OR_BEYOND = ['demo', 'quote', 'negotiation', 'won', 'paid'];
const QUOTE_OR_BEYOND = ['quote', 'negotiation', 'won', 'paid'];
const PAID_ONLY = ['paid'];

const INACTIVE_STAGES = ['won', 'paid', 'not_interested', 'paused'];

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await connectDb();

  const [
    totalClinics,
    activeClinics,
    outreachCount,
    positiveReplies,
    interested,
    demoPreparing,
    demoShared,
    quotesSent,
    paid,
    dueToday,
    overdue,
    contactedCount,
  ] = await Promise.all([
    ClinicModel.countDocuments({}),
    ClinicModel.countDocuments({ stage: { $nin: INACTIVE_STAGES } }),
    InteractionModel.countDocuments({
      type: { $in: ['message', 'reply'] },
    }),
    ClinicModel.countDocuments({ stage: { $in: INTEREST_AND_BEYOND } }),
    ClinicModel.countDocuments({ stage: 'initial_interest' }),
    ClinicModel.countDocuments({ stage: 'demo_preparing' }),
    ClinicModel.countDocuments({ stage: { $in: DEMO_OR_BEYOND } }),
    ClinicModel.countDocuments({ stage: { $in: QUOTE_OR_BEYOND } }),
    ClinicModel.countDocuments({ stage: { $in: PAID_ONLY } }),
    FollowUpModel.countDocuments({
      status: 'open',
      dueAt: { $gte: startOfDay(), $lt: endOfDay() },
    }),
    FollowUpModel.countDocuments({
      status: 'open',
      dueAt: { $lt: startOfDay() },
    }),
    ClinicModel.countDocuments({ stage: { $in: CONTACTED_AND_BEYOND } }),
  ]);

  const hasEnoughDataForRates = contactedCount >= 5;
  const conversionToInterest =
    contactedCount > 0 ? (positiveReplies / contactedCount) * 100 : null;
  const conversionToPaid =
    contactedCount > 0 ? (paid / contactedCount) * 100 : null;

  return {
    totalClinics,
    activeClinics,
    outreachCount,
    positiveReplies,
    interested,
    demoPreparing,
    demoShared,
    quotesSent,
    paid,
    dueToday,
    overdue,
    conversionToInterest:
      hasEnoughDataForRates && conversionToInterest != null
        ? Math.round(conversionToInterest * 10) / 10
        : null,
    conversionToPaid:
      hasEnoughDataForRates && conversionToPaid != null
        ? Math.round(conversionToPaid * 10) / 10
        : null,
    hasEnoughDataForRates,
  };
}

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(): Date {
  const d = startOfDay();
  d.setDate(d.getDate() + 1);
  return d;
}