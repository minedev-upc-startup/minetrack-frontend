/** @typedef {'Client' | 'Owner' | 'Intermediary' | 'Maintenance'} AppRole */

export const USER_ROLES = {
    CLIENT: 'Client',
    OWNER: 'Owner',
    INTERMEDIARY: 'Intermediary',
    MAINTENANCE: 'maintenance'
};

export const APP_ROLES = ['Client', 'Owner', 'Intermediary', 'Maintenance'];

/**
 * Maps API / persisted role strings to canonical app roles (case-insensitive).
 *
 * @param {unknown} role
 * @returns {AppRole | null}
 */
export function normalizeAppRole(role) {
    if (role == null) return null;
    const s = String(role).trim();
    if (!s) return null;
    const found = APP_ROLES.find(r => r.toLowerCase() === s.toLowerCase());
    return found ?? null;
}
