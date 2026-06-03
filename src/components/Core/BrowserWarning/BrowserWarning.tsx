export default function BrowserWarning() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-center text-foreground">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
        <h1 className="mb-4 text-2xl font-bold text-destructive">Unsupported Browser</h1>
        <p className="mb-6 text-muted-foreground">
          Trackster requires the File System Access API, which is not supported in your current browser.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Please use a Chromium-based browser such as Google Chrome, Microsoft Edge, Brave, or Arc.
        </p>
        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Download Chrome
        </a>
      </div>
    </div>
  );
}

