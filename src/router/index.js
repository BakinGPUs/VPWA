import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'

export default route(function () {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/hahahihi', component: () => import('layouts/GarbageLayout.vue') },
      { path: '/login', alias: '/', component: () => import('pages/LoginPage.vue') },
      { path: '/:catchAll(.*)*', redirect: '/login'}
    ]
  })
})
