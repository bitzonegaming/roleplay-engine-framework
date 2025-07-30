/**
 * Universal logger interface compatible with popular logging libraries.
 *
 * Supports flexible method signatures to work with different logging patterns:
 * - logger.info('message')
 * - logger.info('message', { context })
 * - logger.error('message', error)
 * - logger.error('message', error, { context })
 */
export interface RPLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export const defaultLogger: RPLogger = {
  debug: (message: string, ...args: unknown[]) => console.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => console.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
  error: (message: string, ...args: unknown[]) => console.error(message, ...args),
};
