// components/guide/GuideTour.tsx
//
// Darkens the screen, spotlights one tool/feature at a time and shows a text bubble next to it.
// It only needs `data-guide="..."` attributes on the elements it should point at (see guideSteps.ts).

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GUIDE_STEPS, type GuideStep } from './guideSteps';

type Props = {
  /** Called when the tour is finished OR skipped/closed. */
  onClose: () => void;
};

type Rect = { top: number; left: number; width: number; height: number };
type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';
type Pos = { top: number; left: number; placement: Placement; arrow: number };

const SPOT_PAD = 6; // breathing room around the highlighted element
const GAP = 14; // distance between the highlight and the bubble
const MARGIN = 16; // minimum distance from the screen edge

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

// Returns the element only if it actually exists and is on screen
// (e.g. the left sidebar is hidden on mobile, so its steps get skipped there).
function getVisibleTarget(target: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(`[data-guide="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const onScreen =
    r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight;
  return onScreen ? el : null;
}

export default function GuideTour({ onClose }: Props) {
  // Only keep steps whose target exists on this screen, so "Step X of Y" is always accurate
  const [steps] = useState<GuideStep[]>(() => GUIDE_STEPS.filter((s) => !s.target || getVisibleTarget(s.target)));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, placement: 'center', arrow: 0 });

  const bubbleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = useCallback(() => (isLast ? onClose() : setIndex((i) => i + 1)), [isLast, onClose]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Measure the highlighted element
  const measure = useCallback(() => {
    const el = step.target ? getVisibleTarget(step.target) : null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect((prev) =>
      prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
        ? prev
        : { top: r.top, left: r.left, width: r.width, height: r.height },
    );
  }, [step]);

  // When a step opens: run its action (e.g. switch tab), scroll it into view, then measure.
  // Measured again after the sidebar/tab animations finish.
  useEffect(() => {
    step.onEnter?.();
    if (step.target) getVisibleTarget(step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    measure();
    const timers = [window.setTimeout(measure, 120), window.setTimeout(measure, 400)];
    nextRef.current?.focus({ preventScroll: true });
    return () => timers.forEach(window.clearTimeout);
  }, [step, measure]);

  // Keep the spotlight attached on resize/scroll
  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // Keyboard: Esc closes, arrows navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, onClose]);

  // Decide where the bubble goes (below / above / right / left of the target, or centered)
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!rect) {
      setPos({ top: (vh - h) / 2, left: (vw - w) / 2, placement: 'center', arrow: 0 });
      return;
    }

    const t = rect.top - SPOT_PAD;
    const l = rect.left - SPOT_PAD;
    const b = rect.top + rect.height + SPOT_PAD;
    const r = rect.left + rect.width + SPOT_PAD;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const horizontal = () => clamp(cx - w / 2, MARGIN, vw - w - MARGIN);
    const vertical = () => clamp(cy - h / 2, MARGIN, vh - h - MARGIN);

    if (vh - b - MARGIN >= h + GAP) {
      const left = horizontal();
      setPos({ top: b + GAP, left, placement: 'bottom', arrow: clamp(cx - left, 20, w - 20) });
    } else if (t - MARGIN >= h + GAP) {
      const left = horizontal();
      setPos({ top: t - GAP - h, left, placement: 'top', arrow: clamp(cx - left, 20, w - 20) });
    } else if (vw - r - MARGIN >= w + GAP) {
      const top = vertical();
      setPos({ top, left: r + GAP, placement: 'right', arrow: clamp(cy - top, 20, h - 20) });
    } else if (l - MARGIN >= w + GAP) {
      const top = vertical();
      setPos({ top, left: l - GAP - w, placement: 'left', arrow: clamp(cy - top, 20, h - 20) });
    } else {
      // Target is huge (e.g. the task list): show the bubble over its middle
      setPos({ top: vertical(), left: horizontal(), placement: 'center', arrow: 0 });
    }
  }, [rect, index]);

  const arrowBase = 'absolute w-3 h-3 bg-white rotate-45 border-[#DEE2E6]';

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Click blocker: stops clicks reaching the app while the guide is open */}
      <div className={`absolute inset-0 ${rect ? '' : 'bg-[#212529]/80'}`} onClick={(e) => e.stopPropagation()} />

      {/* Spotlight: the huge box-shadow is what darkens everything except the highlighted element */}
      {rect && (
        <div
          aria-hidden="true"
          className="absolute rounded-md ring-2 ring-white/90 pointer-events-none transition-all duration-200 motion-reduce:transition-none"
          style={{
            top: rect.top - SPOT_PAD,
            left: rect.left - SPOT_PAD,
            width: rect.width + SPOT_PAD * 2,
            height: rect.height + SPOT_PAD * 2,
            boxShadow: '0 0 0 9999px rgba(33, 37, 41, 0.78)',
          }}
        />
      )}

      {/* Text bubble */}
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-body"
        className="absolute rounded-md bg-white text-[#212529] border border-[#DEE2E6] shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F] p-4 transition-[top,left] duration-200 motion-reduce:transition-none"
        style={{ top: pos.top, left: pos.left, width: 'min(340px, calc(100vw - 32px))' }}
      >
        {pos.placement === 'bottom' && <span className={`${arrowBase} -top-1.5 border-l border-t`} style={{ left: pos.arrow - 6 }} />}
        {pos.placement === 'top' && <span className={`${arrowBase} -bottom-1.5 border-r border-b`} style={{ left: pos.arrow - 6 }} />}
        {pos.placement === 'right' && <span className={`${arrowBase} -left-1.5 border-l border-b`} style={{ top: pos.arrow - 6 }} />}
        {pos.placement === 'left' && <span className={`${arrowBase} -right-1.5 border-r border-t`} style={{ top: pos.arrow - 6 }} />}

        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h2 id="guide-title" className="text-sm font-semibold leading-snug">
            {step.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="shrink-0 -mt-1 -mr-1 p-1.5 rounded text-[#495057] hover:bg-[#2125290F] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id="guide-body" className="text-sm leading-relaxed text-[#495057]">
          {step.body}
        </p>

        {/* Progress bar */}
        <div className="mt-4 h-1 rounded-full bg-[#E9ECEF] overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-[#BF5700] transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-[#5C636A] tabular-nums">
            {index + 1} of {steps.length}
          </span>

          <div className="flex items-center gap-1.5">
            {!isLast && (
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-2.5 rounded text-xs font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
              >
                Skip
              </button>
            )}
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="h-8 px-2 flex items-center gap-0.5 rounded text-xs font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="h-8 px-3 flex items-center gap-1 rounded bg-[#212529] hover:bg-[#495057] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {isLast ? 'Finish' : isFirst ? "Let's go" : 'Next'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}