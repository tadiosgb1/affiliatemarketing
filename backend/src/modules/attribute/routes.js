const r = require('express').Router();
const c = require('./controller');
const a = require('../../shared/middleware/auth');
const h = require('../../shared/utils/async');
const { requirePermission } = require('../../shared/middleware/requirePermission');

const manage = [a.requireAuth, requirePermission('catalog.manage')];

r.get('/', h(c.list));
r.post('/', ...manage, h(c.create));
r.post('/:id/values', ...manage, h(c.addValue));
r.get('/categories/:categoryId', h(c.category));
r.post('/categories/:categoryId', ...manage, h(c.assignCategory));
r.patch('/categories/:categoryId/:attributeId', ...manage, h(c.updateCategoryRule));
r.delete('/categories/:categoryId/:attributeId', ...manage, h(c.removeCategoryRule));

module.exports = r;
