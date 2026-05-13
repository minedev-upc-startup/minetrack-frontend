const machineList = () => import('./views/machine-list.vue');
const machineForm = () => import('./views/machine-form.vue');

const catalogRoutes = [
    { path: '',           name: 'catalog-list', component: machineList, meta: { title: 'Machines', requiresAuth: true } },
    { path: 'new',        name: 'catalog-new',  component: machineForm, meta: { title: 'New Machine', requiresAuth: true } },
    { path: ':id/edit',   name: 'catalog-edit', component: machineForm, meta: { title: 'Edit Machine', requiresAuth: true } }
];

export default catalogRoutes;