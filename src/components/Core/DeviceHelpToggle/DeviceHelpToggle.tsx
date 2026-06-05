import { useUIStore } from '../../../stores/useUIStore';
import { cn } from '../../../lib/utils';
import { HelpCircle } from 'lucide-react';

interface DeviceHelpToggleProps {
  guideUrl: string;
  className?: string;
}

/**
 * Floating "?" button that toggles the inline help/manual mode for a device.
 *
 * When OFF (default), device controls behave normally — clicks invoke their
 * intended actions and the documentation drawer stays hidden.
 *
 * When ON, the device's user guide opens in the side drawer, controls become
 * highlight-reactive, and clicking a control scrolls the drawer to the relevant
 * section instead of invoking the control's primary action.
 */
export default function DeviceHelpToggle({ guideUrl, className }: DeviceHelpToggleProps) {
  const helpMode = useUIStore((s) => s.helpMode);
  const setHelpMode = useUIStore((s) => s.setHelpMode);
  const setActiveDoc = useUIStore((s) => s.setActiveDoc);

  const handleClick = () => {
    if (helpMode) {
      // Turning help mode off also closes the documentation drawer.
      setActiveDoc(null);
    } else {
      setHelpMode(true);
      setActiveDoc({ url: guideUrl, type: 'md' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={helpMode}
      aria-label={helpMode ? 'Close inline help' : 'Open inline help'}
      title={helpMode ? 'Close inline help' : 'Show inline help'}
      className={cn(
        'absolute top-3 right-3 z-30 h-10 w-10 rounded-full flex items-center justify-center',
        'border transition-all duration-200 shadow-lg backdrop-blur-sm',
        helpMode
          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.55)] ring-2 ring-cyan-400/60'
          : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:text-cyan-300 hover:border-cyan-500/60 hover:bg-neutral-800/90',
        className,
      )}
    >
      <HelpCircle size={22} strokeWidth={2.25} />
    </button>
  );
}
