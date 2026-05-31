import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import { Button } from '../../Core/ui/button';
import * as Icons from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../Core/ui/dialog';

export default function DisclaimerModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { openRootDirectory } = useFileSystemStore();

  const handleMount = async (mode: 'read' | 'readwrite') => {
    onClose();
    await openRootDirectory(mode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-destructive">
        <DialogHeader>
          <DialogTitle className="text-2xl text-destructive flex items-center gap-2">
            <Icons.AlertTriangle className="h-6 w-6" />
            EXPERIMENTAL WARNING: POTENTIAL DATA LOSS
          </DialogTitle>
          <DialogDescription className="pt-4 text-base space-y-4 text-foreground">
            <span className="block">
              <strong>This application is highly experimental and directly modifies the file system of your SD card.</strong> Bugs or unexpected behavior CAN and WILL lead to unrecoverable data loss (obliterated packs, renamed/deleted samples).
            </span>
            <span className="block font-bold text-destructive">
              It is MANDATORY to keep a backup of your SD card before using this tool. You have been warned!
            </span>
            <span className="block">
              We strongly recommend using the default <strong>Read-Only (Simulated)</strong> mode unless you are 100% sure you want to write changes to your card. In Read-Only mode, you can safely explore and organize samples, but changes will not be saved to disk.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-3 sm:space-x-0 mt-6">
          <Button 
            variant="default" 
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
            onClick={() => handleMount('read')}
          >
            <Icons.ShieldCheck className="mr-2 h-5 w-5" />
            Mount in Read-Only Mode (Safe)
          </Button>
          <Button 
            variant="destructive" 
            size="lg"
            className="w-full font-bold h-12"
            onClick={() => handleMount('readwrite')}
          >
            <Icons.Skull className="mr-2 h-5 w-5" />
            Mount in Read/Write Mode (Dangerous)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
