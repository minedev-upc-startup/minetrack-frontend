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
            const response = await iamApi.findByEmail(command.email);
            const matching = response.data.find(u => u.password === command.password);
            if (!matching) {
                errors.value.push(new Error('iam.signIn.invalidCredentials'));
                return;
            }
            const normalized = normalizeAppRole(matching.role);
            if (!normalized || !APP_ROLES.includes(normalized)) {
                errors.value.push(new Error('iam.signIn.invalidRole'));
                return;
            }
            const user = UserAssembler.toEntityFromResource(matching);
            persistSession(user);
            const returnTo = router.currentRoute.value.query.returnTo;
            if (typeof returnTo === 'string' && returnTo.length > 0) {
                router.push(returnTo);
            } else {
                const first = getSidebarItemsForRole(normalized)[0]?.routeName;
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
            const existing = await iamApi.findByEmail(command.email);
            if (existing.data.length > 0) {
                errors.value.push(new Error('iam.signUp.duplicateEmail'));
                return;
            }
            const normalized = normalizeAppRole(command.role);
            const roleToPersist = normalized && APP_ROLES.includes(normalized) ? normalized : 'Client';
            const response = await iamApi.createUser({
                email: command.email,
                password: command.password,
                fullName: command.fullName,
                role: roleToPersist,
                phone: command.phone,
                company: command.company,
                createdAt: new Date().toISOString()
            });
            const user = UserAssembler.toEntityFromResource(response.data);
            persistSession(user);
            const first = getSidebarItemsForRole(user.role)[0]?.routeName;
            router.push(first ? { name: first } : { name: 'iam-sign-in' });
        } catch (error) {
            errors.value.push(error);
        }
    }

    function signOut() {
        clearSessionState();
        clearStoredSession();
    }

    /**
     * Internal — write session state and a synthesized fake JWT to localStorage.
     * Replace this with real JWT issuance once the C# backend is in place.
     */
    function persistSession(user) {
        const role = normalizeAppRole(user.role) ?? 'Client';
        const payload = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role,
            phone: user.phone ?? '',
            company: user.company ?? ''
        };
        const fakeToken = `fake-jwt.${payload.id}.${role}.${Date.now()}`;
        localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
        isSignedIn.value = true;
        currentUserId.value = payload.id;
        currentUsername.value = payload.fullName ?? payload.email;
        currentUserRole.value = role;
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
