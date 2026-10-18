module.exports = (sequelize, D) => sequelize.define('VariantMedia', {
  variantId: { type: D.UUID, allowNull: false, primaryKey: true },
  mediaId: { type: D.UUID, allowNull: false, primaryKey: true },
  role: { type: D.STRING(30), allowNull: false, defaultValue: 'gallery' },
  sortOrder: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  isPrimary: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'variant_media', indexes: [{ fields: ['variant_id', 'sort_order'] }] });