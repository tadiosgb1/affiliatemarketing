module.exports = (sequelize, D) => sequelize.define('ProductCategory', {
  productId: { type: D.UUID, allowNull: false, primaryKey: true },
  categoryId: { type: D.UUID, allowNull: false, primaryKey: true },
  isPrimary: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'product_categories', indexes: [{ fields: ['category_id', 'product_id'] }] });