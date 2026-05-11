/**
 * Utility helpers for MVP MONOZUKURI
 */

/**
 * Format a date string to locale format.
 */
export function formatDate(dateStr, locale = 'es-ES') {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format a datetime string including time.
 */
export function formatDateTime(dateStr, locale = 'es-ES') {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a number as percentage.
 */
export function formatPercent(value, decimals = 1) {
    if (value == null) return '—';
    return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format currency.
 */
export function formatCurrency(value, currency = 'MXN', locale = 'es-MX') {
    if (value == null) return '—';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/**
 * Classify OEE value for color coding.
 */
export function getOEEColor(oee) {
    if (oee >= 85) return 'green';
    if (oee >= 60) return 'yellow';
    return 'red';
}

/**
 * Build query string from params object (strips nullish values).
 */
export function buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== '') {
            searchParams.append(key, value);
        }
    });
    return searchParams.toString();
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Get initials from a name (for avatars).
 */
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
