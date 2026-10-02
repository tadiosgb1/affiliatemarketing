import { reactive, computed } from 'vue'
export const auth=reactive({user:JSON.parse(localStorage.getItem('user')||'null')})
export function setAuth(user,token){auth.user=user;localStorage.setItem('user',JSON.stringify(user));if(token)localStorage.setItem('token',token)}
export function logout(){auth.user=null;localStorage.removeItem('user');localStorage.removeItem('token')}
export const cart=reactive({items:JSON.parse(localStorage.getItem('cart')||'[]')})
export const cartCount=computed(()=>cart.items.reduce((n,i)=>n+i.quantity,0))
export const cartTotal=computed(()=>cart.items.reduce((n,i)=>n+(Number(i.price)||0)*i.quantity,0))
export function addToCart(product,variant=null){const v=variant||(product.variants||[])[0];if(!v)return false;const x=cart.items.find(i=>i.variantId===v.id);x?x.quantity++:cart.items.push({productId:product.id,variantId:v.id,name:product.name,variantLabel:(v.options||[]).map(o=>o.value?.label||o.value?.value).join(' / '),price:v.price??product.price,imageUrl:v.imageUrl||product.imageUrl,quantity:1});localStorage.setItem('cart',JSON.stringify(cart.items));return true}
export function removeFromCart(id){cart.items=cart.items.filter(i=>i.variantId!==id);localStorage.setItem('cart',JSON.stringify(cart.items))}
export function clearCart(){cart.items=[];localStorage.removeItem('cart')}
