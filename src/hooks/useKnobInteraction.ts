import { useState, useRef, useEffect } from 'react';

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

  // Sync with external value if controlled and not dragging
  useEffect(() => {
    if (value !== undefined && !isDragging.current) {
      const newRot = minRotation + value * rotationRange;
      currentRotation.current = newRot;
      setInternalRotation(newRot);
    }
  }, [value, minRotation, rotationRange]);

  const rotation = isDragging.current 
    ? internalRotation 
    : (value !== undefined ? minRotation + value * rotationRange : internalRotation);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    currentRotation.current = rotation;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.preventDefault();
    if (onInteract) onInteract();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY;
    startY.current = e.clientY;
    
    const delta = deltaY * sensitivity;
    currentRotation.current = Math.min(maxRotation, Math.max(minRotation, currentRotation.current + delta));
    
    setInternalRotation(currentRotation.current);
    
    if (onChange) {
      const normalizedValue = (currentRotation.current - minRotation) / rotationRange;
      onChange(normalizedValue);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const resetRotation = () => {
    if (value !== undefined && onChange) {
      // 0 degrees corresponds to half-way if symmetric
      const centerVal = (0 - minRotation) / rotationRange;
      onChange(centerVal);
    } else {
      setInternalRotation(0);
      currentRotation.current = 0;
    }
  };

  return {
    rotation,
    handlePointerDown,
    resetRotation
  };
}
