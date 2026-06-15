const iotPanel = () => import('./views/iot-panel.vue');

const maintenanceRoutes = [
    {
        path: '/iot-monitoring',
        name: 'iot-panel',
        component: iotPanel,
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            roles: ['Maintenance'],
            titleKey: 'nav.iotMonitor'
        }
    }
];

export default maintenanceRoutes;
