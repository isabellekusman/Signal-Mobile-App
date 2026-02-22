/**
 * Logger Service
 *
 * Centralized error logging via Sentry.
 * Wraps Sentry.captureException and Sentry.addBreadcrumb to provide
 * a clean API for the rest of the app.
 *
 * Usage:
 *   import { logger } from '../services/logger';
 *   logger.error(error, { tags: { feature: 'decoder' } });
 *   logger.warn('Something odd happened', { extra: { userId: '123' } });
 *   logger.breadcrumb('User tapped Decode', 'ui.click');
 */

import * as Sentry from '@sentry/react-native';

// ─── Types ──────────────────────────────────────────────────

interface LogContext {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
}

// ─── Core API ───────────────────────────────────────────────

/**
 * Capture an error and send it to Sentry.
 * In __DEV__ mode it also logs to console for convenience.
 */
function error(err: unknown, context?: LogContext): void {
    if (__DEV__) {
        console.error('[Logger]', err);
    }

    if (err instanceof Error) {
        Sentry.captureException(err, {
            tags: context?.tags,
            extra: context?.extra,
        });
    } else {
        Sentry.captureException(new Error(String(err)), {
            tags: context?.tags,
            extra: { ...context?.extra, originalValue: err },
        });
    }
}

/**
 * Capture a warning-level message.
 * Warnings are sent to Sentry as breadcrumbs (not full events)
 * unless the caller explicitly wants an event.
 */
function warn(message: string, context?: LogContext & { asEvent?: boolean }): void {
    if (__DEV__) {
        console.warn('[Logger]', message);
    }

    if (context?.asEvent) {
        Sentry.captureMessage(message, {
            level: 'warning',
            tags: context?.tags,
            extra: context?.extra,
        });
    } else {
        Sentry.addBreadcrumb({
            message,
            level: 'warning',
            data: context?.extra,
        });
    }
}

/**
 * Add a navigation / interaction breadcrumb.
 * These appear in the Sentry issue timeline for context.
 */
function breadcrumb(
    message: string,
    category: string = 'app',
    data?: Record<string, any>,
): void {
    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data,
    });
}

/**
 * Set user context on Sentry so all future events are tagged.
 */
function identifyUser(userId: string, email?: string): void {
    Sentry.setUser({ id: userId, email });
}

/**
 * Clear user context (on sign-out).
 */
function clearUser(): void {
    Sentry.setUser(null);
}

// ─── Export ─────────────────────────────────────────────────

export const logger = {
    error,
    warn,
    breadcrumb,
    identifyUser,
    clearUser,
};
