const signInForm = () => import('./views/sign-in-form.vue');
const signUpForm = () => import('./views/sign-up-form.vue');

const iamRoutes = [
    { path: 'sign-in', name: 'iam-sign-in', component: signInForm, meta: { titleKey: 'iam.signIn.title', layout: 'auth' } },
    { path: 'sign-up', name: 'iam-sign-up', component: signUpForm, meta: { titleKey: 'iam.signUp.title', layout: 'auth' } }
];

export default iamRoutes;
