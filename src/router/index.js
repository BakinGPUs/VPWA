import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'

export default route(function () {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: () => import('layouts/MainLayout.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/:catchAll(.*)*', redirect: '/login'}
    ]
  })
})
