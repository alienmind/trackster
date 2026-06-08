import * as Icons from 'lucide-react';
import { Button } from '../ui/button';

interface BrowserWarningProps {
  onClose: () => void;
}

export default function BrowserWarning({ onClose }: BrowserWarningProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6 text-center text-foreground">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl relative">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground h-8 w-8">
          <Icons.X size={20} />
        </Button>
        <h1 className="mb-4 text-2xl font-bold text-destructive">Feature Not Supported</h1>
        <p className="mb-6 text-muted-foreground">
          Your current browser does not support the File System Access API required to mount an SD card.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          This feature requires a Chromium-based desktop browser (like Google Chrome, Microsoft Edge, Brave, or Arc). Mobile browsers and iOS/iPadOS currently do not support this API.
        </p>
        <Button
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Understood
        </Button>
      </div>
    </div>
  );
}

