import { reactive, computed } from 'vue'
export const auth=reactive({user:JSON.parse(localStorage.getItem('user')||'null')})
export function setAuth(user,token){auth.user=user;localStorage.setItem('user',JSON.stringify(user));if(token)localStorage.setItem('token',token)}
export function logout(){auth.user=null;localStorage.removeItem('user');localStorage.removeItem('token')}
export const cart=reactive({items:[]})
export const cartCount=computed(()=>cart.items.reduce((n,i)=>n+i.quantity,0))
export const cartTotal=computed(()=>cart.items.reduce((n,i)=>n+(Number(i.price)||0)*i.quantity,0))
export function addToCart(product){const x=cart.items.find(i=>i.productId===product.id);x?x.quantity++:cart.items.push({productId:product.id,name:product.name,price:product.price,imageUrl:product.imageUrl,quantity:1})}
export function removeFromCart(id){cart.items=cart.items.filter(i=>i.productId!==id)}
