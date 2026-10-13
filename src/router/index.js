import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import { store } from 'src/store'

export default route(function () {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: () => import('layouts/MainLayout.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/:catchAll(.*)*', redirect: '/' }
    ]
  })

  // Neprihlásený používateľ sa dostane iba na /login
  router.beforeEach(to => {
    if (to.path !== '/login' && !store.me) return '/login'
  })

  return router
})
