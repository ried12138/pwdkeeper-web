import { createRouter, createWebHashHistory } from 'vue-router';
import UserDataPage from '../components/UserDataPage.vue';
import VerificationCode from '../components/VerificationCode.vue';
import DeepSeekPage from '../components/DeepSeekPage.vue'; 
import HomePage from '../components/HomePage.vue';
import FarmPage from '../components/FarmPage.vue';

const routes = [
  {
    path: '/',
    name: 'VerificationCode',
    component: VerificationCode,
  },
  {
    path: '/home',
    name: 'HomePage',
    component: HomePage,
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
  {
    path: '/farm',
    name: 'FarmPage',
    component: FarmPage,
  },
  // ... existing routes ...
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;