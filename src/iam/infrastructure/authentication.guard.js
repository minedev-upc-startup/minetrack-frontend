import { unref } from 'vue';
import useIamStore from '../application/iam.store.js';

/**
 * Authentication guard.
 *
 * Contract:
 *   meta.requiresAuth omitted or false -> public route, allowed
 *   meta.requiresAuth === true         -> only authenticated users allowed
 *
 * Returns true if navigation is allowed, false otherwise.
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {boolean}
 */
export function authenticationGuard(to) {
    if (!to.meta?.requiresAuth) return true;
    const iam = useIamStore();
    return Boolean(unref(iam.isSignedIn));
}
