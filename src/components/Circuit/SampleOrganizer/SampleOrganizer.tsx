import SortableGrid from '../../Circuit/Grid/SortableGrid';
import PageTabs from '../../Circuit/PageTabs/PageTabs';
import StagingArea from '../../Circuit/StagingArea/StagingArea';
import SampleToolbar from '../../Core/Toolbar/SampleToolbar';
import FileInspector from '../../Core/FileInspector/FileInspector';
import Oscilloscope from '../../Core/Oscilloscope/Oscilloscope';

export default function SampleOrganizer() {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0 flex-col">
      <SampleToolbar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-background border-r border-border">
          <div className="h-48 bg-card border-b border-border flex gap-4 p-4 shrink-0 z-10 shadow-sm">
            <div className="w-80"><FileInspector /></div>
            <div className="flex-1 relative border border-border/50 rounded bg-black overflow-hidden shadow-inner"><Oscilloscope /></div>
          </div>
          <PageTabs />
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-40">
            <div className="max-w-5xl mx-auto flex flex-col h-full">
              <SortableGrid />
            </div>
          </div>
          
          <StagingArea />
        </div>
      </div>
    </div>
  );
}
