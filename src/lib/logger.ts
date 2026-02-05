import { supabase } from '@/integrations/supabase/client';

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Predefined categories for consistent logging
export type LogCategory = 'system' | 'auth' | 'edge' | 'order' | 'payment' | 'product' | 'user';

interface LogOptions {
  level: LogLevel;
  category: LogCategory;
  source: string;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * System logger utility for creating consistent log entries
 * Logs are stored in the system_logs table for admin monitoring
 */
class SystemLogger {
  private isEnabled = true;

  /**
   * Log a message to the system_logs table
   * Only admins can insert logs due to RLS policies
   */
  async log(options: LogOptions): Promise<void> {
    if (!this.isEnabled) return;

    const { level, category, source, message, userId, metadata = {} } = options;

    try {
      // Add timestamp to metadata for debugging
      const enrichedMetadata = {
        ...metadata,
        logged_at: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      };

      const { error } = await supabase.from('system_logs').insert({
        level,
        category,
        source,
        message,
        user_id: userId || null,
        metadata: enrichedMetadata,
      });

      if (error) {
        // Silently fail - don't break the app if logging fails
        console.warn('Failed to write system log:', error.message);
      }
    } catch (err) {
      // Silently fail for any unexpected errors
      console.warn('Logger error:', err);
    }
  }

  /**
   * Log a debug message - for detailed debugging information
   */
  debug(source: string, message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'debug', category: 'system', source, message, metadata });
  }

  /**
   * Log an info message - for general operational information
   */
  info(source: string, message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'info', category: 'system', source, message, metadata });
  }

  /**
   * Log a warning message - for potential issues that don't break functionality
   */
  warn(source: string, message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'warn', category: 'system', source, message, metadata });
  }

  /**
   * Log an error message - for errors that affect functionality
   */
  error(source: string, message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'error', category: 'system', source, message, metadata });
  }

  /**
   * Log an authentication event
   */
  auth(level: LogLevel, message: string, userId?: string, metadata?: Record<string, unknown>): void {
    this.log({ level, category: 'auth', source: 'AuthSystem', message, userId, metadata });
  }

  /**
   * Log an order event
   */
  order(level: LogLevel, message: string, orderId?: string, userId?: string, metadata?: Record<string, unknown>): void {
    this.log({
      level,
      category: 'order',
      source: 'OrderSystem',
      message,
      userId,
      metadata: { ...metadata, order_id: orderId },
    });
  }

  /**
   * Log a payment event
   */
  payment(level: LogLevel, message: string, orderId?: string, metadata?: Record<string, unknown>): void {
    this.log({
      level,
      category: 'payment',
      source: 'PaymentSystem',
      message,
      metadata: { ...metadata, order_id: orderId },
    });
  }

  /**
   * Log an edge function event (typically called from edge functions)
   */
  edge(level: LogLevel, functionName: string, message: string, metadata?: Record<string, unknown>): void {
    this.log({
      level,
      category: 'edge',
      source: functionName,
      message,
      metadata,
    });
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Export a singleton instance
export const logger = new SystemLogger();

// Export helper for creating scoped loggers
export function createScopedLogger(source: string, category: LogCategory = 'system') {
  return {
    debug: (message: string, metadata?: Record<string, unknown>) =>
      logger.log({ level: 'debug', category, source, message, metadata }),
    info: (message: string, metadata?: Record<string, unknown>) =>
      logger.log({ level: 'info', category, source, message, metadata }),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      logger.log({ level: 'warn', category, source, message, metadata }),
    error: (message: string, metadata?: Record<string, unknown>) =>
      logger.log({ level: 'error', category, source, message, metadata }),
  };
}
