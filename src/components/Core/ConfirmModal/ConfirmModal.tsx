import { Button } from '../../Core/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../Core/ui/dialog';
import * as Icons from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  description, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel,
  destructive = false
}: { 
  isOpen: boolean; 
  title: React.ReactNode; 
  description: React.ReactNode; 
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void; 
  onCancel: () => void; 
  destructive?: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className={`sm:max-w-[425px] ${destructive ? 'border-destructive' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${destructive ? 'text-destructive' : 'text-foreground'}`}>
            {destructive && <Icons.AlertTriangle className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription className="pt-4 text-sm space-y-4 text-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:space-x-0 mt-6">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
