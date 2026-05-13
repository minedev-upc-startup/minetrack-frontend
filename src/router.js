import { createRouter, createWebHistory } from 'vue-router';
import iamRoutes from './iam/presentation/iam-routes.js';
import { authenticationGuard } from './iam/infrastructure/authentication.guard.js';
import { roleGuard } from './shared/infrastructure/role-guard.js';
import catalogRoutes from './catalog/presentation/catalog-routes.js';
// Lazy-loaded shared views
const home = () => import('./shared/presentation/views/home.vue');
const about = () => import('./shared/presentation/views/about.vue');
const forbidden = () => import('./shared/presentation/views/forbidden.vue');
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

/*
 * Adding a new bounded context:
 * 1. Create the routes file at src/<context>/presentation/<context>-routes.js
 * 2. Import it here and register a parent route (see iamRoutes example below).
 * 3. Use route meta:
 *      meta: { title: 'Catalog', requiresAuth: true, roles: ['Owner', 'Client'] }
 *    requiresAuth omitted = public route
 *    roles omitted        = any authenticated user
 *    roles: ['Owner']     = only Owner role allowed
 */
const routes = [
    { path: '/home',            name: 'home',       component: home,      meta: { title: 'Home' } },
    { path: '/about',           name: 'about',      component: about,     meta: { title: 'About' } },
    { path: '/forbidden',       name: 'forbidden',  component: forbidden, meta: { title: 'Forbidden' } },
    { path: '/iam',             name: 'iam',        children: iamRoutes },

    { path: '/catalog',     name: 'catalog',     children: catalogRoutes },
    // TODO(teammate-rentals):    { path: '/rentals',     name: 'rentals',     children: rentalsRoutes },
    // TODO(teammate-iot):        { path: '/iot',         name: 'iot',         children: iotRoutes },
    // TODO(teammate-dashboards): { path: '/dashboard',   name: 'dashboard',   children: dashboardRoutes },
    // TODO(teammate-reviews):    { path: '/reviews',     name: 'reviews',     children: reviewsRoutes },

    { path: '/',                redirect: '/home' },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'Not Found' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    document.title = `MineTrack — ${to.meta.title ?? ''}`.trim();
    if (!authenticationGuard(to)) {
        return next({ name: 'iam-sign-in', query: { returnTo: to.fullPath } });
    }
    if (!roleGuard(to)) {
        return next({ name: 'forbidden' });
    }
    return next();
});

export default router;
