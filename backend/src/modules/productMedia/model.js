module.exports = (sequelize, D) => sequelize.define('ProductMedia', {
  productId: { type: D.UUID, allowNull: false, primaryKey: true },
  mediaId: { type: D.UUID, allowNull: false, primaryKey: true },
  role: { type: D.STRING(30), allowNull: false, defaultValue: 'gallery' },
  sortOrder: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  isPrimary: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'product_media', indexes: [{ fields: ['product_id', 'sort_order'] }] });