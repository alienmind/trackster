import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';


export interface UseKnobInteractionProps {
  /** Optional value from 0 to 1 for controlled knobs */
  value?: number;
  /** Callback when value changes (passed 0 to 1) */
  onChange?: (val: number) => void;
  /** Minimum rotation in degrees */
  minRotation?: number;
  /** Maximum rotation in degrees */
  maxRotation?: number;
  /** Speed multiplier for dragging */
  sensitivity?: number;
  /** Callback fired when pointer goes down (useful for focus/doc triggers) */
  onInteract?: () => void;
}

/**
 * Rotary-knob pointer interaction hook.
 *
 * Implementation note (anti-render-storm): the document-level `pointermove`
 * and `pointerup` listeners are attached ONCE per pointerdown and read all
 * their inputs (current `onChange`, `sensitivity`, etc.) through a ref that
 * is refreshed on every render. This means that even if the parent component
 * re-renders rapidly mid-drag (for example the Global Sequencer ticking at
 * 16th notes), the listener closure stays fresh AND we never re-register
 * window listeners. See DEV_ARCHITECTURE.md §10 for the broader guardrail.
 */
export function useKnobInteraction({
  value,
  onChange,
  minRotation = -135,
  maxRotation = 135,
  sensitivity = 2.7,
  onInteract
}: UseKnobInteractionProps = {}) {
  const rotationRange = maxRotation - minRotation;

  // Convert 0-1 value to degrees, or default to 0 degrees if uncontrolled
  const getInitialRotation = () => {
    if (value !== undefined) {
      return minRotation + value * rotationRange;
    }
    return 0;
  };

  const [internalRotation, setInternalRotation] = useState(getInitialRotation());
  const currentRotation = useRef(getInitialRotation());
  const isDragging = useRef(false);
  const startY = useRef(0);
  // Suppress the value-sync effect for a short window after pointer-up so any
  // last in-flight store commit cannot snap the visible knob back.
  const lastDragEndAt = useRef(0);

  // Keep latest props/callbacks behind a ref so the window listeners below
  // can call them without being re-registered on every parent re-render.
  // The ref is refreshed in a layout effect (post-render, pre-paint) which
  // is the React-blessed way to mirror props in a ref.
  const propsRef = useRef({ value, onChange, minRotation, maxRotation, sensitivity, onInteract, rotationRange });
  useLayoutEffect(() => {
    propsRef.current = { value, onChange, minRotation, maxRotation, sensitivity, onInteract, rotationRange };
  });


  // Sync with external value if controlled and not dragging.
  useEffect(() => {
    if (value === undefined) return;
    if (isDragging.current) return;
    if (Date.now() - lastDragEndAt.current < 80) return;
    const newRot = minRotation + value * rotationRange;
    currentRotation.current = newRot;
    setInternalRotation(newRot);
  }, [value, minRotation, rotationRange]);

  const rotation = isDragging.current
    ? internalRotation
    : (value !== undefined ? minRotation + value * rotationRange : internalRotation);

  // Stable listener identities so addEventListener / removeEventListener
  // always refer to the same function objects, even across many parent renders.
  // The actual logic is held in refs that get refreshed in a layout effect.
  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>(() => {});
  const handlePointerUpRef = useRef<() => void>(() => {});

  const onWindowPointerMove = useCallback((e: PointerEvent) => handlePointerMoveRef.current(e), []);
  const onWindowPointerUp = useCallback(() => handlePointerUpRef.current(), []);

  useLayoutEffect(() => {
    handlePointerMoveRef.current = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const p = propsRef.current;
      const deltaY = startY.current - e.clientY;
      startY.current = e.clientY;

      const delta = deltaY * p.sensitivity;
      currentRotation.current = Math.min(p.maxRotation, Math.max(p.minRotation, currentRotation.current + delta));

      setInternalRotation(currentRotation.current);

      if (p.onChange) {
        const normalizedValue = (currentRotation.current - p.minRotation) / p.rotationRange;
        p.onChange(normalizedValue);
      }
    };

    handlePointerUpRef.current = () => {
      isDragging.current = false;
      lastDragEndAt.current = Date.now();
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
    };
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    e.preventDefault();
    propsRef.current.onInteract?.();
  }, [onWindowPointerMove, onWindowPointerUp]);


  const resetRotation = useCallback(() => {
    const p = propsRef.current;
    if (p.value !== undefined && p.onChange) {
      const centerVal = (0 - p.minRotation) / p.rotationRange;
      p.onChange(centerVal);
    } else {
      setInternalRotation(0);
      currentRotation.current = 0;
    }
  }, []);

  return {
    rotation,
    handlePointerDown,
    resetRotation
  };
}

