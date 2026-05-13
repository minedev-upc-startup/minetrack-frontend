import { unref } from 'vue';
import useIamStore from '../../iam/application/iam.store.js';
import { normalizeAppRole } from './user-role.js';

/**
 * Route role guard.
 *
 * Contract (defined in CONVENTIONS.md):
 *   meta.requiresAuth omitted  -> public route (skip auth check)
 *   meta.roles omitted         -> any authenticated user is allowed
 *   meta.roles = ['Owner']     -> only authenticated users whose role is in the array
 *
 * Returns true if the navigation is allowed, false if it must be blocked.
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {boolean}
 */
export function roleGuard(to) {
    const requiredRoles = to.meta?.roles;
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const iam = useIamStore();
    const currentRole = normalizeAppRole(unref(iam.currentUserRole));
    if (!currentRole) return false;
    return requiredRoles.includes(currentRole);
}
