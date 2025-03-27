import { createRouter, createWebHistory } from 'vue-router';
import VerificationView from '../views/VerificationView.vue';
import UserDataView from '../views/UserDataView.vue';

const routes = [
  {
    path: '/',
    name: 'Verification',
    component: VerificationView,
  },
  {
    path: '/user-data',
    name: 'UserDataView',
    component: UserDataView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;    