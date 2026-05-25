import { useFileSystemStore } from '../../stores/useFileSystemStore';
import PackPad from './PackPad';

export default function PackOrganizer() {
  const packSlots = useFileSystemStore((s) => s.packSlots);

  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="max-w-6xl mx-auto flex flex-col space-y-8">
        
        <div>
          <h2 className="text-xl font-bold mb-4 text-foreground">Packs (Page 1: 00-31)</h2>
          <div className="grid grid-cols-8 gap-3">
            {packSlots.slice(0, 32).map((slot) => (
              <PackPad key={slot.index} slot={slot} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-foreground">Packs (Page 2: 32-63)</h2>
          <div className="grid grid-cols-8 gap-3">
            {packSlots.slice(32, 64).map((slot) => (
              <PackPad key={slot.index} slot={slot} />
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
