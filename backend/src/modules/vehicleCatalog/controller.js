const { sequelize, Product, VehicleMake, VehicleModel, VehicleGeneration, ProductVehicleFitment } = require('../../database/models');

exports.listMakes = async (_req, res) => {
  const data = await VehicleMake.findAll({
    include: [{ model: VehicleModel, as: 'models', include: [{ model: VehicleGeneration, as: 'generations' }] }],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data });
};

exports.createMake = async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ success: false, message: 'Vehicle make name is required.' });
  const [data, created] = await VehicleMake.findOrCreate({ where: { name }, defaults: { name } });
  res.status(created ? 201 : 200).json({ success: true, data });
};

exports.createModel = async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!req.body.makeId || !name) return res.status(400).json({ success: false, message: 'makeId and model name are required.' });
  const make = await VehicleMake.findByPk(req.body.makeId);
  if (!make) return res.status(404).json({ success: false, message: 'Vehicle make not found.' });
  const [data, created] = await VehicleModel.findOrCreate({ where: { makeId: make.id, name }, defaults: { makeId: make.id, name } });
  res.status(created ? 201 : 200).json({ success: true, data });
};

exports.createGeneration = async (req, res) => {
  const model = await VehicleModel.findByPk(req.body.modelId);
  if (!model) return res.status(404).json({ success: false, message: 'Vehicle model not found.' });
  const yearFrom = req.body.yearFrom == null || req.body.yearFrom === '' ? null : Number(req.body.yearFrom);
  const yearTo = req.body.yearTo == null || req.body.yearTo === '' ? null : Number(req.body.yearTo);
  if ((yearFrom !== null && (!Number.isInteger(yearFrom) || yearFrom < 1886 || yearFrom > 2200)) ||
      (yearTo !== null && (!Number.isInteger(yearTo) || yearTo < 1886 || yearTo > 2200)) ||
      (yearFrom !== null && yearTo !== null && yearTo < yearFrom)) {
    return res.status(400).json({ success: false, message: 'Enter a valid vehicle year range.' });
  }
  const data = await VehicleGeneration.create({
    modelId: model.id, generationName: req.body.generationName || null,
    yearFrom, yearTo, bodyStyle: req.body.bodyStyle || null,
  });
  res.status(201).json({ success: true, data });
};

exports.listProductFitments = async (req, res) => {
  const product = await Product.findByPk(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  const data = await ProductVehicleFitment.findAll({
    where: { productId: product.id },
    include: [{ model: VehicleGeneration, as: 'generation', include: [{ model: VehicleModel, as: 'model', include: [{ model: VehicleMake, as: 'make' }] }] }],
  });
  res.json({ success: true, data });
};

exports.addProductFitment = async (req, res) => {
  const product = await Product.findByPk(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  const generation = await VehicleGeneration.findByPk(req.body.vehicleGenerationId);
  if (!generation) return res.status(404).json({ success: false, message: 'Vehicle generation not found.' });
  const [data, created] = await ProductVehicleFitment.findOrCreate({
    where: { productId: product.id, vehicleGenerationId: generation.id },
    defaults: { productId: product.id, vehicleGenerationId: generation.id, notes: req.body.notes || null },
  });
  if (!created && req.body.notes !== undefined) await data.update({ notes: req.body.notes });
  res.status(created ? 201 : 200).json({ success: true, data });
};

exports.removeProductFitment = async (req, res) => {
  const deleted = await ProductVehicleFitment.destroy({
    where: { productId: req.params.productId, vehicleGenerationId: req.params.generationId },
  });
  if (!deleted) return res.status(404).json({ success: false, message: 'Vehicle fitment not found.' });
  res.json({ success: true, message: 'Vehicle fitment removed.' });
};