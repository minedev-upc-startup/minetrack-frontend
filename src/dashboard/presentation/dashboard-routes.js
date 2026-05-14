const dashboardOverview = () => import('./views/dashboard-overview.vue');

const dashboardRoutes = [
    { path: '', name: 'dashboard-overview', component: dashboardOverview, meta: { title: 'Dashboard', requiresAuth: true } }
];
export default dashboardRoutes;