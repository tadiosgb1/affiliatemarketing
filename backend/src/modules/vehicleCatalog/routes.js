const r = require('express').Router();
const c = require('./controller');
const auth = require('../../shared/middleware/auth');
const asyncHandler = require('../../shared/utils/async');
const { requirePermission } = require('../../shared/middleware/requirePermission');

r.get('/makes', asyncHandler(c.listMakes));
r.post('/makes', auth.requireAuth, requirePermission('catalog.manage'), asyncHandler(c.createMake));
r.post('/models', auth.requireAuth, requirePermission('catalog.manage'), asyncHandler(c.createModel));
r.post('/generations', auth.requireAuth, requirePermission('catalog.manage'), asyncHandler(c.createGeneration));
r.get('/products/:productId/fitments', asyncHandler(c.listProductFitments));
r.post('/products/:productId/fitments', auth.requireAuth, requirePermission('catalog.manage'), asyncHandler(c.addProductFitment));
r.delete('/products/:productId/fitments/:generationId', auth.requireAuth, requirePermission('catalog.manage'), asyncHandler(c.removeProductFitment));

module.exports = r;