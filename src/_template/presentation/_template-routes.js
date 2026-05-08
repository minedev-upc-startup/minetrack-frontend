const exampleList = () => import('./views/example-list.vue');
const exampleForm = () => import('./views/example-form.vue');

const templateRoutes = [
    { path: '',           name: 'template-list', component: exampleList, meta: { title: 'Examples', requiresAuth: true } },
    { path: 'new',        name: 'template-new',  component: exampleForm, meta: { title: 'New Example', requiresAuth: true } },
    { path: ':id/edit',   name: 'template-edit', component: exampleForm, meta: { title: 'Edit Example', requiresAuth: true } }
];

export default templateRoutes;
