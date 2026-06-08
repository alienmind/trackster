import { useEffect, useRef, useState, useCallback } from 'react';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import type { RenamePlan } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../Core/ui/dialog';
import { Button } from '../../Core/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function CommitDialog() {
  const isCommitDialogOpen = useUIStore((s) => s.isCommitDialogOpen);
  const closeCommitDialog = useUIStore((s) => s.closeCommitDialog);
  const commitChanges = useCircuitTracksStore((s) => s.commitChanges);
  const executeRenamePlan = useCircuitTracksStore((s) => s.executeRenamePlan);
  const clearExecuteProgress = useCircuitTracksStore((s) => s.clearExecuteProgress);
  const executeProgress = useCircuitTracksStore((s) => s.executeProgress);

  const [plan, setPlan] = useState<RenamePlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      setScrollMetrics({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 0);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
    setScrollMetrics({ scrollTop, scrollHeight, clientHeight });
  }, []);

  // Drag-to-scroll thumb. Captures pointer on the thumb and translates vertical
  // drag distance into scrollTop changes using the same scale as the track.
  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    e.preventDefault();
    e.stopPropagation();
    const trackRect = track.getBoundingClientRect();
    const startY = e.clientY;
    const startScrollTop = el.scrollTop;
    const overflow = Math.max(0, el.scrollHeight - el.clientHeight);
    if (overflow === 0) return;
    const thumbH = Math.max(24, (el.clientHeight / el.scrollHeight) * trackRect.height);
    const trackUsable = Math.max(1, trackRect.height - thumbH);
    const scale = overflow / trackUsable;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const next = Math.min(overflow, Math.max(0, startScrollTop + dy * scale));
      el.scrollTop = next;
    };
    const onUp = (ev: PointerEvent) => {
      try { target.releasePointerCapture(ev.pointerId); } catch { /* noop */ }
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  // Click on the empty part of the track jumps the thumb (centered on click).
  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    if (e.target !== track) return; // ignore clicks on the thumb itself
    const trackRect = track.getBoundingClientRect();
    const overflow = Math.max(0, el.scrollHeight - el.clientHeight);
    if (overflow === 0) return;
    const thumbH = Math.max(24, (el.clientHeight / el.scrollHeight) * trackRect.height);
    const trackUsable = Math.max(1, trackRect.height - thumbH);
    const rawTop = e.clientY - trackRect.top - thumbH / 2;
    const ratio = Math.min(1, Math.max(0, rawTop / trackUsable));
    el.scrollTop = ratio * overflow;
  };

  useEffect(() => {
    if (isCommitDialogOpen) {
      commitChanges().then(setPlan);
    } else {
      setPlan(null);
    }
  }, [isCommitDialogOpen, commitChanges]);

  useEffect(() => {
    // Re-evaluate after the list is rendered. Dialog open animation may not be
    // finished yet, so poll for a few frames until the scroll container is
    // measured (scrollHeight > 0), then stop.
    let raf = 0;
    let attempts = 0;
    const tick = () => {
      updateScrollState();
      attempts++;
      const el = scrollRef.current;
      if (attempts < 30 && (!el || el.scrollHeight === 0)) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    const el = scrollRef.current;
    const ro = el && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateScrollState())
      : null;
    if (ro && el) {
      ro.observe(el);
      // Also observe the inner content so growth of the list re-evaluates.
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }

    const onWindowResize = () => updateScrollState();
    window.addEventListener('resize', onWindowResize);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', onWindowResize);
    };
  }, [plan, isExecuting, updateScrollState]);

  const handleExecute = async () => {
    if (!plan) return;
    setIsExecuting(true);
    try {
      await executeRenamePlan(plan);
    } finally {
      setIsExecuting(false);
      clearExecuteProgress();
      closeCommitDialog();
    }
  };

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(160, Math.floor(el.clientHeight * 0.85));
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const target = Math.min(max, Math.max(0, el.scrollTop + dir * step));
    // Prefer smooth scrollTo; fall back to direct scrollTop write so it always
    // moves even in environments where smooth scrolling is disabled or queued.
    try {
      el.scrollTo({ top: target, behavior: 'smooth' });
    } catch {
      el.scrollTop = target;
    }
    // updateScrollState fires on the resulting scroll event.
  };

  // Keyboard navigation on the scroll container (PageUp/PageDown/Home/End/Arrows).
  const onScrollKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const page = Math.max(160, Math.floor(el.clientHeight * 0.85));
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    let target: number | null = null;
    if (e.key === 'PageDown') target = Math.min(max, el.scrollTop + page);
    else if (e.key === 'PageUp') target = Math.max(0, el.scrollTop - page);
    else if (e.key === 'End') target = max;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'ArrowDown') target = Math.min(max, el.scrollTop + 40);
    else if (e.key === 'ArrowUp') target = Math.max(0, el.scrollTop - 40);
    if (target !== null) {
      e.preventDefault();
      el.scrollTop = target;
    }
  };

  const progressPercent = executeProgress
    ? Math.round((executeProgress.current / executeProgress.total) * 100)
    : 0;

  return (
    <Dialog open={isCommitDialogOpen} onOpenChange={(open) => !open && !isExecuting && closeCommitDialog()}>
      <DialogContent className={`sm:max-w-2xl bg-card border-border overflow-hidden flex flex-col ${isExecuting ? 'h-auto' : 'h-[80vh]'}`}>
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="text-xl font-bold">
            {isExecuting ? 'Applying Changes...' : 'Review Changes'}
          </DialogTitle>
          {plan && !isExecuting && (
            <span className="bg-secondary px-3 py-1 rounded-full text-sm font-mono shrink-0">
              {plan.operations.length} operations
            </span>
          )}
        </DialogHeader>

        {isExecuting && executeProgress ? (
          <div className="mt-4 space-y-3 px-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-mono truncate mr-4">
                {executeProgress.phase}
              </span>
              <span className="text-foreground font-bold tabular-nums shrink-0">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-primary rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {executeProgress.current} / {executeProgress.total} steps completed
            </p>
          </div>
        ) : (
          <div className="relative mt-4 border border-border rounded-md flex-1 min-h-0 overflow-hidden">
            <div
              id="commit-dialog-scroll"
              ref={scrollRef}
              onScroll={updateScrollState}
              onKeyDown={onScrollKeyDown}
              tabIndex={0}
              className="h-full overflow-y-auto outline-none pr-12 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="p-4 space-y-2">
                {!plan || plan.operations.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">No changes to commit.</div>
                ) : (
                  plan.operations.map((op, i) => {
                    const isDelete = op.action === 'delete';
                    return (
                      <div key={i} className="flex items-center space-x-4 bg-muted p-3 rounded text-sm font-mono border border-border min-w-0">
                        {isDelete ? (
                          <>
                            <div className="flex-none text-[10px] uppercase tracking-wider font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                              Delete {op.type}
                            </div>
                            <div className="flex-1 text-destructive line-through opacity-80 truncate" title={op.from}>{op.from}</div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 text-destructive line-through opacity-80 truncate" title={op.from}>{op.from}</div>
                            <div className="text-muted-foreground shrink-0">→</div>
                            <div className="flex-1 text-green-500 truncate" title={op.to}>{op.to}</div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute right-2 top-2 bottom-2 z-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollByDir(-1)}
                  disabled={!canScrollUp}
                  aria-label="Scroll up"
                  title="Scroll up"
                  className="pointer-events-auto shrink-0 size-8 rounded-full border border-border bg-card/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-muted-foreground enabled:hover:text-foreground enabled:hover:bg-muted enabled:cursor-pointer disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="size-4" />
                </button>
                {(() => {
                  const { scrollTop, scrollHeight, clientHeight } = scrollMetrics;
                  const overflow = Math.max(0, scrollHeight - clientHeight);
                  const hasOverflow = overflow > 0 && scrollHeight > 0;
                  const ratio = hasOverflow ? Math.min(1, clientHeight / scrollHeight) : 1;
                  const pos = hasOverflow ? scrollTop / overflow : 0;
                  return (
                    <div
                      ref={trackRef}
                      onPointerDown={onTrackPointerDown}
                      className="pointer-events-auto relative w-2 flex-1 rounded-full bg-muted/70 border border-border overflow-hidden cursor-pointer"
                      aria-hidden={!hasOverflow}
                    >
                      <div
                        onPointerDown={onThumbPointerDown}
                        role="scrollbar"
                        aria-orientation="vertical"
                        aria-controls="commit-dialog-scroll"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(pos * 100)}
                        style={{
                          height: `max(24px, ${ratio * 100}%)`,
                          top: `calc(${pos * 100}% - ${pos} * max(24px, ${ratio * 100}%))`,
                        }}
                        className={`absolute left-0 right-0 rounded-full bg-foreground/40 hover:bg-foreground/60 active:bg-foreground/70 transition-colors ${hasOverflow ? 'cursor-grab active:cursor-grabbing' : 'opacity-0 pointer-events-none'}`}
                      />
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => scrollByDir(1)}
                  disabled={!canScrollDown}
                  aria-label="Scroll down"
                  title="Scroll down"
                  className="pointer-events-auto shrink-0 size-8 rounded-full border border-border bg-card/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-muted-foreground enabled:hover:text-foreground enabled:hover:bg-muted enabled:cursor-pointer disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            variant="default"
            onClick={closeCommitDialog}
            disabled={isExecuting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleExecute}
            disabled={isExecuting || !plan || plan.operations.length === 0}
            className="font-bold"
          >
            {isExecuting ? 'Executing...' : 'Execute Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
