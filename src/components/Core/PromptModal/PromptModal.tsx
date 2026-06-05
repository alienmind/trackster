import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface PromptModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  /** Validate input; return error message string or null when valid. */
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptModal({
  isOpen,
  title,
  description,
  placeholder,
  initialValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  validate,
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    const trimmed = value.trim();
    const err = validate ? validate(trimmed) : (trimmed ? null : 'Value cannot be empty');
    if (err) {
      setError(err);
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="pt-2 text-sm text-foreground/80">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          <Input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
              else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
            }}
          />
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter className="flex gap-2 sm:space-x-0">
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button onClick={handleConfirm}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
