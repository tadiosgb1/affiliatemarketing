import { createRouter, createWebHistory } from 'vue-router'
const routes=[
 {path:'/',redirect:'/shop'},
 {path:'/shop',component:()=>import('../views/shop/ShopView.vue')},
 {path:'/products/:slug',component:()=>import('../views/shop/ProductView.vue')},
 {path:'/cart',component:()=>import('../views/shop/CartView.vue')},
 {path:'/checkout',component:()=>import('../views/shop/CheckoutView.vue')},
 {path:'/orders',component:()=>import('../views/customer/OrdersView.vue')},
 {path:'/affiliate',component:()=>import('../views/affiliate/AffiliateView.vue')},
 {path:'/admin',component:()=>import('../views/admin/DashboardView.vue')},
 {path:'/admin/products',component:()=>import('../views/admin/ProductsView.vue')},
 {path:'/admin/categories',component:()=>import('../views/admin/CategoriesView.vue')},
 {path:'/admin/payments',component:()=>import('../views/admin/PaymentsView.vue')},
 {path:'/login',component:()=>import('../views/auth/LoginView.vue')},
 {path:'/register',component:()=>import('../views/auth/RegisterView.vue')}
]
export default createRouter({history:createWebHistory(),routes,scrollBehavior:()=>({top:0})})