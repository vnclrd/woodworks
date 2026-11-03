import {
  Check,
  Hammer,
  Infinity as InfinityIcon,
  Info,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  formatPrice,
  getPlanLabel,
  hasFullAccess,
  isFreeRole,
  PAYMENTS_ARE_MOCK,
  PLAN_FEATURES,
  PRICING,
  YEARLY_SAVINGS_PERCENT,
  type BillingCycle,
  type PlanId,
} from '../../config/plans';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

type PaidChoice = 'premium' | 'lifetime';

export default function PlansModal({ app }: Props) {
  const { isPlansModalOpen, setIsPlansModalOpen, userRole, handleUpgrade } = app;

  const [billing, setBilling] = useState<BillingCycle>('yearly');
  const [selected, setSelected] = useState<PaidChoice>('premium');
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  const isFree = isFreeRole(userRole);
  const isPremium = userRole === 'premium';
  const fullAccess = hasFullAccess(userRole);

  // Fresh defaults every time the modal opens
  useEffect(() => {
    if (!isPlansModalOpen) return;
    setBilling('yearly');
    setSelected(isPremium ? 'lifetime' : 'premium');
  }, [isPlansModalOpen, isPremium]);

  if (!isPlansModalOpen) return null;

  const close = () => setIsPlansModalOpen(false);

  const planId: PlanId =
    selected === 'lifetime'
      ? 'lifetime'
      : billing === 'yearly'
        ? 'premium_yearly'
        : 'premium_monthly';

  const summary =
    selected === 'lifetime'
      ? {
          title: 'Lifetime access',
          note: `${formatPrice(PRICING.lifetime)} one-time payment`,
        }
      : billing === 'yearly'
        ? {
            title: 'Premium · Yearly',
            note: `${formatPrice(PRICING.premiumYearly)} billed once a year`,
          }
        : {
            title: 'Premium · Monthly',
            note: `${formatPrice(PRICING.premiumMonthly)} billed every month`,
          };

  const handlePurchase = async () => {
    if (pendingPlan) return;
    setPendingPlan(planId);
    try {
      await handleUpgrade(planId);
    } catch {
      /* handleUpgrade reports its own errors */
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#2125298A]'
      onClick={close}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='plans-title'
        className='bg-surface w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden rounded-t-xl sm:rounded-md shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-line'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='w-10 h-10 shrink-0 rounded bg-orange-bg text-orange-fg flex items-center justify-center'>
              <Sparkles className='w-5 h-5' />
            </div>
            <div className='min-w-0'>
              <h2 id='plans-title' className='text-xl font-semibold'>
                {fullAccess ? 'Your plan' : 'Choose your plan'}
              </h2>
              <p className='text-xs text-fg-3 mt-0.5 flex items-center gap-1.5'>
                Current plan
                <span className='rounded-full bg-chip text-fg-2 px-2 py-0.5 text-[11px] font-semibold'>
                  {getPlanLabel(userRole)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label='Close plans'
            className='h-9 w-9 -mr-2 shrink-0 flex items-center justify-center rounded text-fg-2 hover:bg-tint cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        {fullAccess ? (
          <FullAccessPanel label={getPlanLabel(userRole)} onClose={close} />
        ) : (
          <>
            {/* Body */}
            <div className='flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 space-y-5'>
              {PAYMENTS_ARE_MOCK && (
                <div className='flex items-start gap-2 rounded border border-warn-line bg-warn-bg text-warn px-3 py-2 text-xs'>
                  <Info className='w-4 h-4 shrink-0 mt-px' />
                  <span>Test mode: payments are simulated, so you won't be charged.</span>
                </div>
              )}

              {isFree && (
                <div className='flex justify-center'>
                  <div
                    role='radiogroup'
                    aria-label='Billing period'
                    className='inline-flex rounded border border-line bg-subtle p-0.5'
                  >
                    {(['monthly', 'yearly'] as const).map((cycle) => {
                      const active = billing === cycle;
                      return (
                        <button
                          key={cycle}
                          type='button'
                          role='radio'
                          aria-checked={active}
                          onClick={() => {
                            setBilling(cycle);
                            setSelected('premium');
                          }}
                          className={`h-9 px-4 rounded text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                            active
                              ? 'bg-primary text-white'
                              : 'text-fg-2 hover:bg-tint'
                          }`}
                        >
                          {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                          {cycle === 'yearly' && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                active ? 'bg-white/20 text-white' : 'bg-ok-bg text-ok'
                              }`}
                            >
                              Save {YEARLY_SAVINGS_PERCENT}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                role='radiogroup'
                aria-label='Plan'
                className={`grid gap-3 md:gap-4 pt-1 ${
                  isFree ? 'md:grid-cols-3' : 'md:grid-cols-2'
                }`}
              >
                {isFree && (
                  <PlanCard
                    icon={<Hammer className='w-4 h-4' />}
                    name='Free'
                    tagline='Everything you need to get organized'
                    price='$0'
                    priceUnit='forever'
                    features={PLAN_FEATURES.free}
                    mode='current'
                  />
                )}

                <PlanCard
                  icon={<Sparkles className='w-4 h-4' />}
                  name='Premium'
                  tagline={
                    isPremium
                      ? 'Your current subscription'
                      : 'For people who live in their task list'
                  }
                  price={
                    isPremium
                      ? undefined
                      : billing === 'yearly'
                        ? formatPrice(PRICING.premiumYearly / 12)
                        : formatPrice(PRICING.premiumMonthly)
                  }
                  priceUnit='/month'
                  priceNote={
                    !isPremium && billing === 'yearly'
                      ? `Billed ${formatPrice(PRICING.premiumYearly)} yearly`
                      : undefined
                  }
                  features={PLAN_FEATURES.premium}
                  badge={isPremium ? undefined : 'Most popular'}
                  mode={isPremium ? 'current' : 'selectable'}
                  selected={selected === 'premium'}
                  onSelect={() => setSelected('premium')}
                />

                <PlanCard
                  icon={<InfinityIcon className='w-4 h-4' />}
                  name='Lifetime'
                  tagline='Pay once, own it forever'
                  price={formatPrice(PRICING.lifetime)}
                  priceUnit='one-time'
                  priceNote='No renewals, ever'
                  features={PLAN_FEATURES.lifetime}
                  badge='Best value'
                  badgeTone='ok'
                  mode='selectable'
                  selected={selected === 'lifetime'}
                  onSelect={() => setSelected('lifetime')}
                />
              </div>
            </div>

            {/* Sticky checkout bar */}
            <div className='shrink-0 flex items-center justify-between gap-3 border-t border-line bg-surface px-5 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold truncate'>{summary.title}</p>
                <p className='text-xs text-fg-3 truncate'>{summary.note}</p>
              </div>
              <button
                onClick={handlePurchase}
                disabled={pendingPlan !== null}
                aria-busy={pendingPlan !== null}
                className='h-11 sm:h-10 shrink-0 px-5 rounded bg-[#BF5700] hover:bg-[#914000] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer'
              >
                {pendingPlan ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Processing…
                  </>
                ) : selected === 'lifetime' ? (
                  'Get Lifetime access'
                ) : (
                  'Upgrade to Premium'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type PlanCardProps = {
  icon: ReactNode;
  name: string;
  tagline: string;
  price?: string;
  priceUnit?: string;
  priceNote?: string;
  features: readonly string[];
  badge?: string;
  badgeTone?: 'brand' | 'ok';
  mode: 'current' | 'selectable';
  selected?: boolean;
  onSelect?: () => void;
};

function PlanCard({
  icon,
  name,
  tagline,
  price,
  priceUnit,
  priceNote,
  features,
  badge,
  badgeTone = 'brand',
  mode,
  selected = false,
  onSelect,
}: PlanCardProps) {
  const isCurrent = mode === 'current';

  const content = (
    <>
      {badge && (
        <span
          className={`absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            badgeTone === 'ok'
              ? 'bg-ok-bg text-ok border border-ok/30'
              : 'bg-[#BF5700] text-white'
          }`}
        >
          {badge}
        </span>
      )}

      <span className='flex items-start justify-between gap-2'>
        <span className='flex items-center gap-2 text-sm font-semibold'>
          <span
            className={`w-7 h-7 rounded flex items-center justify-center ${
              selected ? 'bg-orange-bg text-orange-fg' : 'bg-chip text-fg-2'
            }`}
          >
            {icon}
          </span>
          {name}
        </span>

        {isCurrent ? (
          <span className='rounded-full bg-chip text-fg-2 px-2 py-0.5 text-[11px] font-semibold'>
            Current plan
          </span>
        ) : (
          <span
            aria-hidden='true'
            className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected
                ? 'border-[#BF5700] bg-[#BF5700] text-white'
                : 'border-line'
            }`}
          >
            {selected && <Check className='w-3 h-3' strokeWidth={3} />}
          </span>
        )}
      </span>

      <span className='block text-xs text-fg-3 mt-2'>{tagline}</span>

      {price && (
        <span className={`block mt-3 ${isCurrent ? 'max-md:hidden' : ''}`}>
          <span className='text-3xl font-semibold tabular-nums'>{price}</span>
          {priceUnit && (
            <span className='text-sm text-fg-3 ml-1'>{priceUnit}</span>
          )}
          {priceNote && (
            <span className='block text-xs text-fg-3 mt-0.5'>{priceNote}</span>
          )}
        </span>
      )}

      <span
        className={`block h-px bg-line my-4 ${isCurrent ? 'max-md:hidden' : ''}`}
      />

      <span
        className={`flex-col gap-2 text-sm ${isCurrent ? 'hidden md:flex' : 'flex'}`}
      >
        {features.map((feature) => (
          <span key={feature} className='flex items-start gap-2'>
            <Check className='w-4 h-4 shrink-0 mt-0.5 text-ok' />
            <span className='text-fg-2'>{feature}</span>
          </span>
        ))}
      </span>
    </>
  );

  if (isCurrent) {
    return (
      <div className='relative flex flex-col rounded-md border-2 border-line bg-subtle p-4'>
        {content}
      </div>
    );
  }

  return (
    <button
      type='button'
      role='radio'
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex flex-col text-left rounded-md border-2 p-4 transition-colors cursor-pointer ${
        selected
          ? 'border-[#BF5700] bg-row-orange'
          : 'border-line bg-surface hover:border-fg-4'
      }`}
    >
      {content}
    </button>
  );
}

function FullAccessPanel({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  return (
    <div className='flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-10 text-center'>
      <div className='mx-auto w-14 h-14 rounded-full bg-ok-bg text-ok flex items-center justify-center'>
        <Check className='w-7 h-7' strokeWidth={2.5} />
      </div>
      <h3 className='text-lg font-semibold mt-4'>You have full access</h3>
      <p className='text-sm text-fg-3 mt-1.5 max-w-sm mx-auto'>
        Your {label} plan includes every WoodWorks feature, permanently. There
        is nothing left to upgrade.
      </p>

      <ul className='mt-6 mx-auto max-w-xs space-y-2 text-sm text-left'>
        {PLAN_FEATURES.lifetime.map((feature) => (
          <li key={feature} className='flex items-start gap-2'>
            <Check className='w-4 h-4 shrink-0 mt-0.5 text-ok' />
            <span className='text-fg-2'>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClose}
        className='mt-8 h-10 px-5 rounded bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors cursor-pointer'
      >
        Back to WoodWorks
      </button>
    </div>
  );
}