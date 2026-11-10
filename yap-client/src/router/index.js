import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import { store, restoreSession } from 'src/store'

export default route(function () {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: () => import('layouts/MainLayout.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/:catchAll(.*)*', redirect: '/' }
    ]
  })

  //bez loginu len na /login
  router.beforeEach(async to => {
    if (!store.me) await restoreSession()
    if (to.path !== '/login' && !store.me) return '/login'
  })

  return router
})
