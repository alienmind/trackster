import { Button } from '../../Core/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../Core/ui/dialog';

export default function InfoModal({ 
  isOpen, 
  title, 
  description, 
  onClose 
}: { 
  isOpen: boolean; 
  title: React.ReactNode; 
  description: React.ReactNode; 
  onClose: () => void; 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="pt-4 text-sm space-y-4 text-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="default" onClick={onClose}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
