import { createRouter, createWebHashHistory } from 'vue-router';
import UserDataPage from '../components/UserDataPage.vue';
import VerificationCode from '../components/VerificationCode.vue';
import DeepSeekPage from '../components/DeepSeekPage.vue'; 

const routes = [
  {
    path: '/',
    name: 'VerificationCode',
    component: VerificationCode,
  },
  {
    path: '/user-data',
    name: 'UserDataPage',
    component: UserDataPage,
  },
  {
    path: '/deepseek',
    name: 'DeepSeekPage',
    component: DeepSeekPage,
  },
  // ... existing routes ...
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;