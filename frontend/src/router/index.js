import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../stores'

const routes = [
  { path: '/', redirect: '/shop' },
  { path: '/shop', component: () => import('../views/shop/ShopView.vue') },
  { path: '/products/:slug', component: () => import('../views/shop/ProductView.vue') },
  { path: '/cart', component: () => import('../views/shop/CartView.vue') },
  { path: '/checkout', component: () => import('../views/shop/CheckoutView.vue') },
  { path: '/orders', component: () => import('../views/customer/OrdersView.vue') },
  { path: '/affiliate', component: () => import('../views/affiliate/AffiliateView.vue') },
  { path: '/admin', meta: { management: true }, component: () => import('../views/admin/DashboardView.vue') },
  { path: '/admin/products', meta: { management: true }, component: () => import('../views/admin/ProductsView.vue') },
  { path: '/admin/categories', meta: { management: true }, component: () => import('../views/admin/CategoriesView.vue') },
  { path: '/admin/payments', meta: { management: true }, component: () => import('../views/admin/PaymentsView.vue') },
  { path: '/login', component: () => import('../views/auth/LoginView.vue') },
  { path: '/register', component: () => import('../views/auth/RegisterView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(to => {
  const isManager = ['admin', 'company_staff'].includes(auth.user?.role)
  if (to.matched.some(record => record.meta.management) && !isManager) {
    return auth.user ? '/shop' : '/login'
  }
  if (['/login', '/register'].includes(to.path) && auth.user) {
    return isManager ? '/admin' : '/shop'
  }
})

export default router
