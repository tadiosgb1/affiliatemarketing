module.exports = (sequelize, D) => sequelize.define('VariantPrice', {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  variantId: { type: D.UUID, allowNull: false },
  currency: { type: D.STRING(3), allowNull: false },
  price: { type: D.DECIMAL(14, 2), allowNull: false, validate: { min: 0 } },
  compareAtPrice: { type: D.DECIMAL(14, 2), validate: { min: 0 } },
  validFrom: { type: D.DATE, allowNull: false, defaultValue: D.NOW },
  validUntil: { type: D.DATE },
}, { tableName: 'variant_prices', indexes: [{ fields: ['variant_id', 'currency', 'valid_from'] }] });