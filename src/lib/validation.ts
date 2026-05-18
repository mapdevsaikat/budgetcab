/**
 * Shared input validators and sanitizers for onboarding/auth forms.
 * No external deps — uses only built-in JS/TS.
 */

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export type FormErrors = Partial<
  Record<'first_name' | 'last_name' | 'email' | 'mobile' | 'password', string>
>;

// ---------------------------------------------------------------------------
// Injection / XSS detection
// ---------------------------------------------------------------------------

/** SQL keywords that are dangerous in any user input context */
const SQL_KEYWORDS = /\b(SELECT|DROP|INSERT|UPDATE|DELETE|UNION|EXEC|SCRIPT)\b/i;

/** Multi-char sequences that signal injection attempts */
const INJECTION_SEQUENCES = /--|\/\*|\*\/|<[a-zA-Z\/]|javascript:/i;

function hasDangerousPatterns(value: string): boolean {
  return SQL_KEYWORDS.test(value) || INJECTION_SEQUENCES.test(value);
}

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

/** Validates first_name / last_name: letters, spaces, hyphens, apostrophes; 1–50 chars */
export function validateName(raw: string): ValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'This field is required' };
  if (trimmed.length > 50) return { ok: false, error: 'Must be 50 characters or fewer' };
  if (hasDangerousPatterns(trimmed)) return { ok: false, error: 'Invalid characters detected' };
  if (!/^[A-Za-z\s'\-]+$/.test(trimmed)) {
    return { ok: false, error: "Only letters, spaces, hyphens, and apostrophes allowed" };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validates email: RFC-style format; max 254 chars.
 * Returns lowercased, trimmed value on success.
 */
export function validateEmail(raw: string): ValidationResult {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Email is required' };
  if (trimmed.length > 254) return { ok: false, error: 'Email must be 254 characters or fewer' };
  if (hasDangerousPatterns(trimmed)) return { ok: false, error: 'Invalid email format' };
  // RFC 5321-ish regex: local@domain.tld
  const emailRe =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRe.test(trimmed)) return { ok: false, error: 'Enter a valid email address' };
  return { ok: true, value: trimmed };
}

/**
 * Validates Indian mobile: 10 digits after stripping spaces, dashes, +91/91 prefix.
 * Must start with 6–9.
 */
export function validateMobile(raw: string): ValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Mobile number is required' };
  if (hasDangerousPatterns(trimmed)) return { ok: false, error: 'Invalid mobile number' };

  // Strip formatting characters and country prefix
  let digits = trimmed.replace(/[\s\-\(\)]/g, '');
  digits = digits.replace(/^\+91/, '');
  // Strip leading "91" only when followed by a 10-digit number starting with 6-9
  digits = digits.replace(/^91(?=[6-9]\d{9}$)/, '');

  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: 'Mobile number must contain only digits' };
  }
  if (digits.length !== 10) {
    return { ok: false, error: 'Enter a valid 10-digit mobile number' };
  }
  if (!/^[6-9]/.test(digits)) {
    return { ok: false, error: 'Mobile number must start with 6, 7, 8, or 9' };
  }
  return { ok: true, value: digits };
}

const BLOCKED_PASSWORDS = new Set([
  'password123', 'password1', 'password12', '12345678', '123456789',
  '1234567890', 'qwerty123', 'qwerty1', 'pass1234', 'letmein1', 'welcome1',
  'abc12345', 'iloveyou1',
]);

/**
 * Validates password: 8–72 chars, ≥1 letter, ≥1 digit, not in blocklist.
 * @param required  false for signup where a blank password is accepted (auto-generated)
 */
export function validatePassword(raw: string, required = true): ValidationResult {
  if (!raw) {
    return required
      ? { ok: false, error: 'Password is required' }
      : { ok: true, value: '' };
  }
  if (raw.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };
  if (raw.length > 72) return { ok: false, error: 'Password must be 72 characters or fewer' };
  if (!/[a-zA-Z]/.test(raw)) {
    return { ok: false, error: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(raw)) {
    return { ok: false, error: 'Password must contain at least one number' };
  }
  if (BLOCKED_PASSWORDS.has(raw.toLowerCase())) {
    return { ok: false, error: 'This password is too common — please choose a stronger one' };
  }
  if (SQL_KEYWORDS.test(raw) || INJECTION_SEQUENCES.test(raw)) {
    return { ok: false, error: 'Password contains invalid patterns' };
  }
  return { ok: true, value: raw };
}

// ---------------------------------------------------------------------------
// UX-level rate limiting (localStorage, client-only guard)
// ---------------------------------------------------------------------------

const RL_KEY = 'bc_ob_rl';
const RL_MAX_ATTEMPTS = 5;
const RL_LOCKOUT_MS = 30_000; // 30 seconds

interface RLState {
  attempts: number;
  lockedUntil: number; // epoch ms; 0 = not locked
}

function getRLState(): RLState {
  if (typeof window === 'undefined') return { attempts: 0, lockedUntil: 0 };
  try {
    const raw = localStorage.getItem(RL_KEY);
    return raw ? (JSON.parse(raw) as RLState) : { attempts: 0, lockedUntil: 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function saveRLState(state: RLState): void {
  try {
    localStorage.setItem(RL_KEY, JSON.stringify(state));
  } catch {
    // storage quota or private-mode — silently ignore
  }
}

/** Returns current lock status without modifying state. */
export function checkRateLimit(): { limited: boolean; secondsLeft: number } {
  const { lockedUntil } = getRLState();
  const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
  if (secondsLeft > 0) return { limited: true, secondsLeft };
  return { limited: false, secondsLeft: 0 };
}

/** Call after each failed auth attempt. Returns updated lock status. */
export function recordFailedAttempt(): { limited: boolean; secondsLeft: number } {
  const state = getRLState();
  // If a previous lock already expired, reset the counter
  if (state.lockedUntil > 0 && state.lockedUntil < Date.now()) {
    saveRLState({ attempts: 1, lockedUntil: 0 });
    return { limited: false, secondsLeft: 0 };
  }
  const attempts = state.attempts + 1;
  const lockedUntil = attempts >= RL_MAX_ATTEMPTS ? Date.now() + RL_LOCKOUT_MS : 0;
  saveRLState({ attempts, lockedUntil });
  const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
  return { limited: lockedUntil > 0, secondsLeft };
}

/** Call after a successful auth to clear the attempt counter. */
export function resetRateLimit(): void {
  try {
    localStorage.removeItem(RL_KEY);
  } catch {
    // ignore
  }
}
