import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import { useAudioStore } from '../../../stores/useAudioStore';
import { useUIStore } from '../../../stores/useUIStore';

export default function StatusBar() {
  const slots = useFileSystemStore((s) => s.slots);
  const pendingChanges = useFileSystemStore((s) => s.pendingChanges);
  const duplicatePairs = useAudioStore((s) => s.duplicatePairs);
  const analysisProgress = useAudioStore((s) => s.analysisProgress);
  const activeMainView = useUIStore((s) => s.activeMainView);

  if (activeMainView === 'overview') return null;

  const filledSlots = slots.filter((s) => s.sample !== null).length;

  return (
    <div className="h-8 flex-none border-t border-border bg-card px-4 flex items-center justify-between text-xs text-muted-foreground">
      <div>
        {filledSlots}/64 slots filled
        {duplicatePairs.length > 0 && ` • ${duplicatePairs.length} potential duplicates`}
      </div>
      <div className="flex items-center space-x-4">
        {analysisProgress && (
          <div className="flex items-center space-x-2">
            <span>Analyzing {analysisProgress.current}/{analysisProgress.total}...</span>
          </div>
        )}
        {pendingChanges > 0 && (
          <span className="text-warning font-medium">
            {pendingChanges} pending change{pendingChanges !== 1 && 's'}
          </span>
        )}
      </div>
    </div>
  );
}
