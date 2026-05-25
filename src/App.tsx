import { useEffect } from 'react';
import { useUIStore } from './stores/useUIStore';
import { PAGES } from './utils/constants';
import BrowserWarning from './components/BrowserWarning/BrowserWarning';

export default function App() {
  const isSupported = 'showDirectoryPicker' in window;
  const activePage = useUIStore((s) => s.activePage);

  useEffect(() => {
    const pageConfig = PAGES.find((p) => p.index === activePage);
    if (pageConfig) {
      document.documentElement.style.setProperty('--accent', pageConfig.color);
    }
  }, [activePage]);

  if (!isSupported) {
    return <BrowserWarning />;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-surface-0">
      {/* Toolbar */}
      <div className="h-16 flex-none border-b border-surface-3 bg-surface-1 px-4 flex items-center">
        <p className="text-text-muted">Toolbar Placeholder</p>
      </div>

      {/* Waveform */}
      <div className="h-32 flex-none border-b border-surface-3 bg-surface-0 flex items-center justify-center">
        <p className="text-text-muted">Waveform Placeholder</p>
      </div>

      {/* Page Tabs */}
      <div className="h-12 flex-none bg-surface-2 flex items-center px-4">
        <p className="text-text-muted">Page Tabs Placeholder</p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center">
        <div className="w-full max-w-5xl rounded border border-surface-3 p-8 flex items-center justify-center">
          <p className="text-text-muted">Grid Placeholder</p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 flex-none border-t border-surface-3 bg-surface-1 px-4 flex items-center text-xs">
        <p className="text-text-muted">Status Bar Placeholder</p>
      </div>
    </div>
  );
}
