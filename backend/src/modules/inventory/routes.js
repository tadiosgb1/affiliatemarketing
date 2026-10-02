// inventory routes
const r=require('express').Router();const c=require('./controller');const a=require('../../shared/middleware/auth');const h=require('../../shared/utils/async');r.get('/',a.requireAuth,h(c.list));r.post('/adjust',a.requireAuth,h(c.adjust));r.post('/transfer',a.requireAuth,h(c.transfer));module.exports=r;
