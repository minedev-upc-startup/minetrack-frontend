import { createRouter, createWebHistory } from 'vue-router';
import iamRoutes from './iam/presentation/iam-routes.js';
import { authenticationGuard } from './iam/infrastructure/authentication.guard.js';
import { roleGuard } from './shared/infrastructure/role-guard.js';

// Lazy-loaded shared views
const home          = () => import('./shared/presentation/views/home.vue');
const about         = () => import('./shared/presentation/views/about.vue');
const forbidden     = () => import('./shared/presentation/views/forbidden.vue');
const pageNotFound  = () => import('./shared/presentation/views/page-not-found.vue');
const comingSoon    = () => import('./shared/presentation/views/coming-soon.vue');

/*
 * Layout assignment:
 *   meta.layout omitted        -> LegacyLayout (topbar only)
 *   meta.layout: 'client'      -> ClientLayout (topbar + Client sidebar)
 *   meta.layout: 'owner'       -> OwnerLayout  (topbar + Owner sidebar)
 *
 * Access control:
 *   meta.requiresAuth omitted  -> public route
 *   meta.roles omitted         -> any authenticated user
 *   meta.roles: ['Owner']      -> only Owner role
 */
const routes = [
    // Public / shared
    { path: '/home',      name: 'home',      component: home,     meta: { title: 'Home' } },
    { path: '/about',     name: 'about',     component: about,    meta: { title: 'About' } },
    { path: '/forbidden', name: 'forbidden', component: forbidden, meta: { title: 'Forbidden' } },

    // IAM (no layout — uses LegacyLayout for sign-in/up screens)
    { path: '/iam', name: 'iam', children: iamRoutes },

    // Client area (placeholders — teammate replaces each component)
    {
        path: '/catalog',
        name: 'catalog-list',
        component: comingSoon,
        meta: { title: 'Catalog', layout: 'client', requiresAuth: true, roles: ['Client'] }
    },
    {
        path: '/client/rentals',
        name: 'client-rentals',
        component: comingSoon,
        meta: { title: 'My rentals', layout: 'client', requiresAuth: true, roles: ['Client'] }
    },

    // Owner area (placeholders — teammates replace each component)
    {
        path: '/owner/dashboard',
        name: 'owner-dashboard',
        component: comingSoon,
        meta: { title: 'Dashboard', layout: 'owner', requiresAuth: true, roles: ['Owner'] }
    },
    {
        path: '/owner/machines',
        name: 'owner-machines',
        component: comingSoon,
        meta: { title: 'My machines', layout: 'owner', requiresAuth: true, roles: ['Owner'] }
    },
    {
        path: '/owner/incoming-requests',
        name: 'owner-incoming-requests',
        component: comingSoon,
        meta: { title: 'Incoming requests', layout: 'owner', requiresAuth: true, roles: ['Owner'] }
    },
    {
        path: '/owner/rentals',
        name: 'owner-rentals',
        component: comingSoon,
        meta: { title: 'My rentals', layout: 'owner', requiresAuth: true, roles: ['Owner'] }
    },
    {
        path: '/owner/iot',
        name: 'owner-iot',
        component: comingSoon,
        meta: { title: 'IoT monitor', layout: 'owner', requiresAuth: true, roles: ['Owner'] }
    },

    // Defaults
    { path: '/',                redirect: '/home' },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'Not Found' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to) => {
    document.title = `MineTrack — ${to.meta.title ?? ''}`.trim();
    if (!authenticationGuard(to)) {
        return { name: 'iam-sign-in', query: { returnTo: to.fullPath } };
    }
    if (!roleGuard(to)) {
        return { name: 'forbidden' };
    }
    return true;
});

export default router;