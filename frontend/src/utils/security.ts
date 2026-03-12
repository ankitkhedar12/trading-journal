/**
 * Frontend Security Utilities
 * XSS prevention, input sanitization, CSRF protection, and rate limiting
 */
import DOMPurify from 'dompurify';

// ─── XSS Prevention ────────────────────────────────────
/**
 * Sanitize user-generated HTML content to prevent XSS attacks.
 * Strips all dangerous tags/attributes and returns safe HTML.
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize a plain text input: trim, strip control characters, and limit length.
 */
export const sanitizeInput = (input: string, maxLength = 1000): string => {
  return input
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .slice(0, maxLength);
};

/**
 * Sanitize an email input specifically.
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().slice(0, 320);
};

// ─── CSRF Protection ───────────────────────────────────
/**
 * Returns standard secure headers for all API requests.
 * Includes CSRF mitigation via custom header.
 */
export const getSecureHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ─── Rate Limiting (UI-side) ───────────────────────────
const rateLimitMap = new Map<string, number>();

/**
 * Simple UI-side rate limiter. Returns true if the action is allowed.
 * @param key - Unique identifier for the action
 * @param cooldownMs - Minimum time between actions in ms (default: 2000)
 */
export const isRateLimited = (key: string, cooldownMs = 2000): boolean => {
  const lastAttempt = rateLimitMap.get(key) || 0;
  const now = Date.now();
  if (now - lastAttempt < cooldownMs) {
    return true; // rate limited
  }
  rateLimitMap.set(key, now);
  return false;
};

// ─── Auth Token Management ─────────────────────────────
interface StoredAuth {
  email: string;
  token: string;
  expiresAt: number;
}

const AUTH_KEY = 'auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Store auth data securely in sessionStorage with expiry.
 */
export const storeAuthSession = (email: string, token: string): void => {
  const session: StoredAuth = {
    email,
    token,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
};

/**
 * Retrieve auth session, returns null if expired or missing.
 */
export const getAuthSession = (): StoredAuth | null => {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const session: StoredAuth = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
};

/**
 * Clear auth session.
 */
export const clearAuthSession = (): void => {
  sessionStorage.removeItem(AUTH_KEY);
  // Also clear legacy localStorage keys
  localStorage.removeItem('auth');
  localStorage.removeItem('user');
};

// ─── File Validation ───────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel'];
const ALLOWED_EXTENSIONS = ['.csv'];

/**
 * Validate an uploaded file for type, size, and extension.
 * Returns an error message or null if valid.
 */
export const validateFile = (file: File): string | null => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Invalid file type. Only CSV files are allowed.`;
  }

  if (file.type && !ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
    // Some browsers don't set type for CSV, so also check extension
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file type "${file.type}". Only CSV files are allowed.`;
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.`;
  }

  if (file.size === 0) {
    return 'File is empty. Please select a valid CSV file.';
  }

  return null;
};
