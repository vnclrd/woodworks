export type PlanId = 'premium_monthly' | 'premium_yearly' | 'lifetime';
export type BillingCycle = 'monthly' | 'yearly';

/** Set to false once real payments are connected (hides the "test mode" notice). */
export const PAYMENTS_ARE_MOCK = true;

export const PRICING = {
  premiumMonthly: 9,
  premiumYearly: 90,
  lifetime: 199,
} as const;

/** How much cheaper yearly is than paying monthly for 12 months (rounded %). */
export const YEARLY_SAVINGS_PERCENT = Math.round(
  (1 - PRICING.premiumYearly / (PRICING.premiumMonthly * 12)) * 100,
);

export const formatPrice = (amount: number) =>
  Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;

// TODO: replace these with what each tier really includes.
export const PLAN_FEATURES = {
  free: [
    'Task management with groups',
    'Daily recurring tasks',
    'Pomodoro timer and notes',
    'Light and dark mode',
  ],
  premium: [
    'Everything in Free',
    'Priority support',
    'Early access to new features',
  ],
  lifetime: [
    'Everything in Premium',
    'Pay once, no renewals',
    'All future updates included',
  ],
} as const;

// ----- Role helpers (userRole comes from the backend) -----

const FULL_ACCESS_ROLES = ['lifetime', 'owner', 'pioneer'];

export const isFreeRole = (role?: string | null) => !role || role === 'free';

/** Lifetime, owner and pioneer accounts have nothing left to upgrade. */
export const hasFullAccess = (role?: string | null) =>
  FULL_ACCESS_ROLES.includes(role ?? '');

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  premium: 'Premium',
  lifetime: 'Lifetime',
  owner: 'Owner',
  pioneer: 'Pioneer',
};

export const getPlanLabel = (role?: string | null) =>
  PLAN_LABELS[role ?? 'free'] ?? 'Free';