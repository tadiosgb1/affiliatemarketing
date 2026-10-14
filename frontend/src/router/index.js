import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../stores'

const routes = [
  { path: '/', component: () => import('../views/shop/HomeView.vue') },
  { path: '/home', redirect: '/' },
  { path: '/shop', redirect: '/products' },
  { path: '/products', component: () => import('../views/shop/ShopView.vue') },
  { path: '/products/:slug', component: () => import('../views/shop/ProductView.vue') },
  { path: '/categories', component: () => import('../views/shop/CategoriesView.vue') },
  { path: '/cart', component: () => import('../views/shop/CartView.vue') },
  { path: '/checkout', component: () => import('../views/shop/CheckoutView.vue') },
  { path: '/orders', component: () => import('../views/customer/OrdersView.vue') },
  { path: '/affiliate', component: () => import('../views/affiliate/AffiliateView.vue') },
  { path: '/admin', meta: { management: true }, component: () => import('../views/admin/DashboardView.vue') },
  { path: '/admin/products', meta: { management: true }, component: () => import('../views/admin/ProductsView.vue') },
  { path: '/admin/inventory', meta: { management: true }, component: () => import('../views/admin/InventoryView.vue') },
  { path: '/admin/inventory-movements', meta: { management: true }, component: () => import('../views/admin/FinanceManagementView.vue') },
  { path: '/admin/orders', meta: { management: true }, component: () => import('../views/admin/OrdersView.vue') },
  { path: '/admin/carts', meta: { management: true }, component: () => import('../views/admin/FinanceManagementView.vue') },
  { path: '/admin/brands', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/variants', meta: { management: true }, component: () => import('../views/admin/VariantsView.vue') },
  { path: '/admin/attributes', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/warehouses', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/suppliers', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/supplier-products', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/purchase-orders', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/affiliate-programs', meta: { management: true }, component: () => import('../views/admin/ResourceManagementView.vue') },
  { path: '/admin/affiliate-links', meta: { management: true }, component: () => import('../views/admin/FinanceManagementView.vue') },
  { path: '/admin/commissions', meta: { management: true }, component: () => import('../views/admin/FinanceManagementView.vue') },
  { path: '/admin/payouts', meta: { management: true }, component: () => import('../views/admin/FinanceManagementView.vue') },
  { path: '/admin/users', meta: { management: true }, component: () => import('../views/admin/UsersView.vue') },
  { path: '/admin/access-control', meta: { management: true, permission: 'access.manage' }, component: () => import('../views/admin/AccessControlView.vue') },
  { path: '/admin/company', meta: { management: true }, component: () => import('../views/admin/CompanySettingsView.vue') },
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
  const roleSlugs = (auth.user?.roles || []).map(role => typeof role === 'string' ? role : role.slug)
  const permissions = auth.user?.permissions || []
  const isManager = ['admin', 'company_staff'].includes(String(auth.user?.role || '').toLowerCase()) || roleSlugs.some(role => role !== 'customer' && role !== 'affiliate') || permissions.some(permission => permission.endsWith('.manage') || permission === 'dashboard.view')
  if (to.matched.some(record => record.meta.permission) && String(auth.user?.role || '').toLowerCase() !== 'admin' && !roleSlugs.includes('admin') && !permissions.includes(to.matched.find(record => record.meta.permission)?.meta.permission)) return '/admin'
  if (to.matched.some(record => record.meta.management) && !isManager) return auth.user ? '/products' : '/login'
  if (['/login', '/register'].includes(to.path) && auth.user) return isManager ? '/admin' : '/products'
})

export default router
