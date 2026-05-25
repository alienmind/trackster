import SortableGrid from '../Grid/SortableGrid';
import PageTabs from '../PageTabs/PageTabs';
import StagingArea from '../StagingArea/StagingArea';
import RightPane from '../RightPane/RightPane';
import SampleToolbar from '../Toolbar/SampleToolbar';

export default function SampleOrganizer() {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0 flex-col">
      <SampleToolbar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-background border-r border-border">
          <PageTabs />
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-40">
            <div className="max-w-5xl mx-auto flex flex-col h-full">
              <SortableGrid />
            </div>
          </div>
          
          <StagingArea />
        </div>
        
        <RightPane />
      </div>
    </div>
  );
}
