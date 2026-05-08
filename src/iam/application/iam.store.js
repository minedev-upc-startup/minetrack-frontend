import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '../infrastructure/iam-api.js';
import { UserAssembler } from '../infrastructure/user.assembler.js';
import { SignInCommand } from '../domain/sign-in.command.js';
import { SignUpCommand } from '../domain/sign-up.command.js';

const iamApi = new IamApi();

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

    const currentToken = computed(() => isSignedIn.value ? localStorage.getItem('token') : null);

    /**
     * Restore a previous session from localStorage on app boot.
     * Called once from App.vue or layout component on mount.
     */
    function restoreSession() {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('currentUser');
        if (!token || !userJson) return;
        try {
            const user = JSON.parse(userJson);
            isSignedIn.value = true;
            currentUserId.value = user.id;
            currentUsername.value = user.fullName ?? user.email;
            currentUserRole.value = user.role;
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
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
            const user = UserAssembler.toEntityFromResource(matching);
            persistSession(user);
            router.push(router.currentRoute.value.query.returnTo ?? { name: 'home' });
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
            const response = await iamApi.createUser({
                email: command.email,
                password: command.password,
                fullName: command.fullName,
                role: command.role,
                phone: command.phone,
                company: command.company,
                createdAt: new Date().toISOString()
            });
            const user = UserAssembler.toEntityFromResource(response.data);
            persistSession(user);
            router.push({ name: 'home' });
        } catch (error) {
            errors.value.push(error);
        }
    }

    function signOut() {
        isSignedIn.value = false;
        currentUserId.value = null;
        currentUsername.value = null;
        currentUserRole.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }

    /**
     * Internal — write session state and a synthesized fake JWT to localStorage.
     * Replace this with real JWT issuance once the C# backend is in place.
     */
    function persistSession(user) {
        const fakeToken = `fake-jwt.${user.id}.${user.role}.${Date.now()}`;
        localStorage.setItem('token', fakeToken);
        localStorage.setItem('currentUser', JSON.stringify(user));
        isSignedIn.value = true;
        currentUserId.value = user.id;
        currentUsername.value = user.fullName ?? user.email;
        currentUserRole.value = user.role;
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
