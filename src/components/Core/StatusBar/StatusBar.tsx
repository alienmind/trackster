import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';

export default function StatusBar() {
  const slots = useCircuitTracksStore((s) => s.slots);
  const pendingChanges = useCircuitTracksStore((s) => s.pendingChanges);
  const duplicatePairs = useCircuitTracksStore((s) => s.duplicatePairs);
  const analysisProgress = useCircuitTracksStore((s) => s.analysisProgress);

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
