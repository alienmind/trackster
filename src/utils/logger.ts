export const DEBUG = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (DEBUG) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (DEBUG) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (DEBUG) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (DEBUG) console.error(...args);
  }
};
