const { Attribute, AttributeValue, Category, CategoryAttribute } = require('../../database/models');
const { slugify } = require('../../shared/utils/slug');

const allowedRoles = ['admin', 'company_staff'];
const canManage = role => allowedRoles.includes(role);

exports.list = async (_req, res) => res.json({
  success: true,
  data: await Attribute.findAll({
    where: { isActive: true },
    include: [{ model: AttributeValue, as: 'values', where: { isActive: true }, required: false, order: [['sortOrder', 'ASC']] }],
    order: [['name', 'ASC']],
  }),
});

exports.create = async (req, res) => {
  const attribute = await Attribute.create({
    name: req.body.name,
    slug: slugify(req.body.name) + '-' + Date.now().toString(36),
    type: req.body.type || 'select',
    dataType: req.body.dataType || ({ number: 'number', boolean: 'boolean', text: 'text' }[req.body.type] || 'text'),
    unit: req.body.unit || null,
    isFilterable: !!req.body.isFilterable,
    isRequired: !!req.body.isRequired,
  });
  if (Array.isArray(req.body.values) && req.body.values.length) {
    await AttributeValue.bulkCreate(req.body.values.map((value, index) => ({
      attributeId: attribute.id,
      value: String(value.value ?? value),
      label: value.label || String(value.value ?? value),
      metadata: value.metadata,
      sortOrder: index,
    })));
  }
  res.status(201).json({
    success: true,
    data: await Attribute.findByPk(attribute.id, { include: [{ model: AttributeValue, as: 'values' }] }),
  });
};

exports.addValue = async (req, res) => {
  if (!canManage(req.user.role)) return res.status(403).json({ success: false, message: 'Company management access required' });
  const attribute = await Attribute.findByPk(req.params.id);
  if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
  res.status(201).json({ success: true, data: await AttributeValue.create({ attributeId: attribute.id, ...req.body }) });
};

exports.assignCategory = async (req, res) => {
  if (!canManage(req.user.role)) return res.status(403).json({ success: false, message: 'Company management access required' });
  const category = await Category.findByPk(req.params.categoryId);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  const attribute = await Attribute.findByPk(req.body.attributeId);
  if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });

  const [rule, created] = await CategoryAttribute.findOrCreate({
    where: { categoryId: category.id, attributeId: attribute.id },
    defaults: {
      isRequired: !!req.body.isRequired,
      isVariant: !!req.body.isVariant,
      sortOrder: Number(req.body.sortOrder) || 0,
    },
  });
  if (!created) {
    await rule.update({
      isRequired: !!req.body.isRequired,
      isVariant: !!req.body.isVariant,
      sortOrder: Number(req.body.sortOrder) || 0,
    });
  }
  res.status(created ? 201 : 200).json({ success: true, data: rule });
};

exports.updateCategoryRule = async (req, res) => {
  if (!canManage(req.user.role)) return res.status(403).json({ success: false, message: 'Company management access required' });
  const rule = await CategoryAttribute.findOne({
    where: { categoryId: req.params.categoryId, attributeId: req.params.attributeId },
  });
  if (!rule) return res.status(404).json({ success: false, message: 'This attribute is not assigned to the category.' });

  const updates = {};
  if (req.body.isRequired !== undefined) updates.isRequired = !!req.body.isRequired;
  if (req.body.isVariant !== undefined) updates.isVariant = !!req.body.isVariant;
  if (req.body.sortOrder !== undefined) {
    const order = Number(req.body.sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      return res.status(400).json({ success: false, message: 'sortOrder must be a non-negative integer.' });
    }
    updates.sortOrder = order;
  }
  await rule.update(updates);
  res.json({ success: true, data: rule });
};

exports.removeCategoryRule = async (req, res) => {
  if (!canManage(req.user.role)) return res.status(403).json({ success: false, message: 'Company management access required' });
  const rule = await CategoryAttribute.findOne({
    where: { categoryId: req.params.categoryId, attributeId: req.params.attributeId },
  });
  if (!rule) return res.status(404).json({ success: false, message: 'This attribute is not assigned to the category.' });
  await rule.destroy();
  res.json({ success: true, message: 'Attribute removed from this category.' });
};

exports.category = async (req, res) => res.json({
  success: true,
  data: await CategoryAttribute.findAll({
    where: { categoryId: req.params.categoryId },
    include: [{
      model: Attribute,
      as: 'attribute',
      include: [{ model: AttributeValue, as: 'values', where: { isActive: true }, required: false }],
    }],
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  }),
});
