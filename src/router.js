import { createRouter, createWebHistory } from 'vue-router';
import iamRoutes from './iam/presentation/iam-routes.js';
import maintenanceRoutes from './maintenance/presentation/maintenance-routes.js';
import { authenticationGuard } from './iam/infrastructure/authentication.guard.js';
import { roleGuard } from './shared/infrastructure/role-guard.js';
import i18n from './i18n.js';
import useIamStore from './iam/application/iam.store.js';

const home = () => import('./shared/presentation/views/home.vue');
const about = () => import('./shared/presentation/views/about.vue');
const forbidden = () => import('./shared/presentation/views/forbidden.vue');
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');
const comingSoon = () => import('./shared/presentation/views/coming-soon.vue');
const catalogView = () => import('./equipment/presentation/views/catalog-view.vue');
const ownerMachinesView = () => import('./equipment/presentation/views/owner-machines-view.vue');
const profileView = () => import('./shared/presentation/views/profile-view.vue');
const clientRequestsView = () => import('./rentals/presentation/views/client-requests-view.vue');
const ownerRentalsView = () => import('./rentals/presentation/views/owner-rentals-view.vue');
const ownerEarningsView = () => import('./rentals/presentation/views/owner-earnings-view.vue');
const dashboardOverview = () => import('./dashboard/presentation/views/dashboard-overview.vue');

const dashboardMeta = (roles, titleKey, extra = {}) => ({
    layout: 'dashboard',
    requiresAuth: true,
    roles,
    titleKey,
    ...extra
});

const routes = [
    { path: '/home', name: 'home', component: home, meta: { titleKey: 'nav.home' } },
    { path: '/about', name: 'about', component: about, meta: { titleKey: 'nav.about' } },
    { path: '/forbidden', name: 'forbidden', component: forbidden, meta: { titleKey: 'errors.forbidden' } },

    { path: '/iam', name: 'iam', component: () => import('./iam/presentation/iam-shell.vue'), children: iamRoutes },

    // Client
    {
        path: '/client/dashboard',
        name: 'client-dashboard',
        component: dashboardOverview,
        meta: dashboardMeta(['Client'], 'nav.clientDashboard')
    },
    {
        path: '/client/my-requests',
        name: 'client-my-requests',
        component: clientRequestsView,
        meta: dashboardMeta(['Client'], 'nav.clientMyRequests')
    },
    {
        path: '/client/catalog',
        name: 'client-catalog',
        component: catalogView,
        meta: dashboardMeta(['Client'], 'nav.catalog', { catalogShell: true })
    },

    // Owner
    {
        path: '/owner/dashboard',
        name: 'owner-dashboard',
        component: dashboardOverview,
        meta: dashboardMeta(['Owner'], 'nav.ownerDashboard')
    },
    {
        path: '/owner/machines',
        name: 'owner-machines',
        component: ownerMachinesView,
        meta: dashboardMeta(['Owner'], 'nav.myMachines')
    },
    {
        path: '/owner/active-rentals',
        name: 'owner-active-rentals',
        component: ownerRentalsView,
        meta: dashboardMeta(['Owner'], 'nav.ownerActiveRentals')
    },
    {
        path: '/owner/earnings',
        name: 'owner-earnings',
        component: ownerEarningsView,
        meta: dashboardMeta(['Owner'], 'nav.ownerEarnings')
    },
    {
        path: '/owner/iot-history',
        name: 'owner-iot-history',
        component: comingSoon,
        meta: dashboardMeta(['Owner'], 'nav.ownerIotHistory')
    },
    {
        path: '/owner/profile',
        name: 'owner-profile',
        component: profileView,
        meta: dashboardMeta(['Owner'], 'nav.ownerProfile')
    },

    // Intermediary (operations / admin)
    {
        path: '/intermediary/dashboard',
        name: 'intermediary-dashboard',
        component: dashboardOverview,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryOperationalPanel')
    },
    {
        path: '/intermediary/catalog',
        name: 'intermediary-catalog',
        component: catalogView,
        meta: dashboardMeta(['Intermediary'], 'nav.catalog', { catalogShell: true })
    },
    {
        path: '/intermediary/requests',
        name: 'intermediary-requests',
        component: comingSoon,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryRequests')
    },
    {
        path: '/intermediary/rentals',
        name: 'intermediary-rentals',
        component: comingSoon,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryRentals')
    },
    {
        path: '/intermediary/iot',
        name: 'intermediary-iot',
        component: comingSoon,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryIotMonitors')
    },
    {
        path: '/intermediary/alerts',
        name: 'intermediary-alerts',
        component: comingSoon,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryAlerts')
    },
    {
        path: '/intermediary/billing',
        name: 'intermediary-billing',
        component: comingSoon,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryBilling')
    },
    {
        path: '/intermediary/users',
        name: 'intermediary-users',
        component: comingSoon,
        meta: dashboardMeta(['Intermediary'], 'nav.intermediaryUsers')
    },

    ...maintenanceRoutes,

    { path: '/', redirect: '/home' },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { titleKey: 'errors.notFound' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach(to => {
    useIamStore().restoreSession();
    const titleKey = to.meta.titleKey;
    const title = titleKey ? i18n.global.t(String(titleKey)) : (to.meta.title ?? '');
    document.title = title ? `MineTrack — ${title}` : 'MineTrack';
    if (!authenticationGuard(to)) {
        return { name: 'iam-sign-in', query: { returnTo: to.fullPath } };
    }
    if (!roleGuard(to)) {
        return { name: 'forbidden' };
    }
    return true;
});

export default router;