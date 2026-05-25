export default function BrowserWarning() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-0 p-6 text-center text-text-primary">
      <div className="max-w-md rounded-xl border border-surface-3 bg-surface-1 p-8 shadow-2xl">
        <h1 className="mb-4 text-2xl font-bold text-danger">Unsupported Browser</h1>
        <p className="mb-6 text-text-secondary">
          Trackster requires the File System Access API, which is not supported in your current browser.
        </p>
        <p className="mb-6 text-sm text-text-muted">
          Please use a Chromium-based browser such as Google Chrome, Microsoft Edge, Brave, or Arc.
        </p>
        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md bg-page-1 px-6 py-2 font-medium text-surface-0 transition-opacity hover:opacity-90"
        >
          Download Chrome
        </a>
      </div>
    </div>
  );
}
