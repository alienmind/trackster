# Development Guidelines

## User Experience

- **No Javascript Popups:** Never use native `alert()`, `confirm()`, or `prompt()` dialogues. These block the main thread and provide a poor user experience. Always use custom UI components (like modals or toast notifications) for user feedback or confirmation.

