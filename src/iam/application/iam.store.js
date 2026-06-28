import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { SignInCommand } from '../domain/sign-in.command.js';
import { SignUpCommand } from '../domain/sign-up.command.js';
import { getSidebarItemsForRole } from '../../shared/infrastructure/navigation-by-role.js';
import { APP_ROLES, normalizeAppRole } from '../../shared/infrastructure/user-role.js';

const iamApi = new IamApi();

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'currentUser';

/**
 * Application service store for the IAM bounded context.
 * Exposes UI-facing identity state and authentication use cases.
 */
const useIamStore = defineStore('iam', () => {
    const isSignedIn         = ref(false);
    const currentUserId      = ref(null);
    const currentUsername    = ref(null);
    const currentUserRole    = ref(null);
    const errors             = ref([]);

    const currentToken = computed(() => isSignedIn.value ? localStorage.getItem(TOKEN_STORAGE_KEY) : null);

    function clearStoredSession() {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
    }

    function clearSessionState() {
        isSignedIn.value = false;
        currentUserId.value = null;
        currentUsername.value = null;
        currentUserRole.value = null;
    }

    /**
     * Restore a previous session from localStorage on app boot / each navigation.
     * Keeps Pinia in sync before layouts and route guards read the role.
     */
    function restoreSession() {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        const userJson = localStorage.getItem(USER_STORAGE_KEY);
        if (!token || !userJson) {
            clearSessionState();
            return;
        }
        try {
            const user = JSON.parse(userJson);
            const role = normalizeAppRole(user.role);
            if (!role || !APP_ROLES.includes(role)) {
                clearStoredSession();
                clearSessionState();
                return;
            }
            isSignedIn.value = true;
            currentUserId.value = user.id;
            currentUsername.value = user.fullName ?? user.email;
            currentUserRole.value = role;
        } catch {
            clearStoredSession();
            clearSessionState();
        }
    }

    /**
     * Execute the sign-in use case.
     * @param {SignInCommand} command
     * @param {import('vue-router').Router} router
     */
    async function signIn(command, router) {
        errors.value = [];
        try {
            const response = await iamApi.signIn(command);
            const resource = response.data;
            // El backend devuelve { id, username, email, token }
            // pero necesitamos también role — por ahora lo tomamos del command
            const user = UserAssembler.toEntityFromResource({
                id: resource.id,
                email: resource.email,
                fullName: resource.username,
                role: resource.role,
                phone: '',
                company: ''
            });
            persistSession(user, resource.token);
            const returnTo = router.currentRoute.value.query.returnTo;
            if (typeof returnTo === 'string' && returnTo.length > 0) {
                router.push(returnTo);
            } else {
                const first = getSidebarItemsForRole(user.role)[0]?.routeName;
                router.push(first ? { name: first } : { name: 'iam-sign-in' });
            }
        } catch (error) {
            errors.value.push(error);
        }
    }

    /**
     * Execute the sign-up use case.
     * @param {SignUpCommand} command
     * @param {import('vue-router').Router} router
     */
    async function signUp(command, router) {
        errors.value = [];
        try {
            await iamApi.signUp(command);
            router.push({ name: 'iam-sign-in' });
        } catch (error) {
            errors.value.push(error);
        }
    }

    /**
     * Internal — write session state and a synthesized fake JWT to localStorage.
     * Replace this with real JWT issuance once the C# backend is in place.
     */
    function persistSession(user, token) {
        const role = normalizeAppRole(user.role) ?? 'Client';
        const payload = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role,
            phone: user.phone ?? '',
            company: user.company ?? ''
        };
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
        isSignedIn.value = true;
        currentUserId.value = payload.id;
        currentUsername.value = payload.fullName ?? payload.email;
        currentUserRole.value = role;
    }

    function signOut() {
        clearSessionState();
        clearStoredSession();
    }

    return {
        isSignedIn,
        currentUserId,
        currentUsername,
        currentUserRole,
        currentToken,
        errors,
        restoreSession,
        signIn,
        signUp,
        signOut
    };
});

export default useIamStore;
