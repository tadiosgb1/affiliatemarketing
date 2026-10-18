require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize, Product, Attribute, ProductVariant, ProductCategory, VariantPrice } = require('../database/models');

async function addMissingColumns(table, definitions) {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable(table);
  for (const [name, definition] of Object.entries(definitions)) {
    if (!columns[name]) {
      await qi.addColumn(table, name, definition);
      console.log('Added', table + '.' + name);
    }
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    // Additive migration only: preserve company, warehouse, supplier, purchasing,
    // inventory, orders, payments and affiliate data already in this database.
    await addMissingColumns('products', {
      product_type: { type: DataTypes.ENUM('physical', 'digital', 'service', 'vehicle'), allowNull: false, defaultValue: 'physical' },
      has_variants: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await addMissingColumns('attributes', {
      data_type: { type: DataTypes.ENUM('text', 'number', 'boolean', 'date', 'json'), allowNull: false, defaultValue: 'text' },
      unit: { type: DataTypes.STRING(50), allowNull: true },
      is_filterable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await addMissingColumns('product_variants', {
      weight_unit: { type: DataTypes.STRING(20), allowNull: true },
      length: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
      width: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
      height: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
      dimension_unit: { type: DataTypes.STRING(20), allowNull: true },
      is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    });

    // Model sync creates only missing tables; it does not use alter/drop.
    await sequelize.sync();

    // Backfill the legacy single category and product-level variant prices into
    // the normalized catalog tables, without deleting or rewriting legacy values.
    await sequelize.query(`
      INSERT IGNORE INTO product_categories
        (product_id, category_id, is_primary, created_at, updated_at)
      SELECT id, category_id, TRUE, NOW(), NOW()
      FROM products
      WHERE category_id IS NOT NULL
    `);
    await sequelize.query(`
      INSERT INTO variant_prices
        (id, variant_id, currency, price, compare_at_price, valid_from, created_at, updated_at)
      SELECT UUID(), pv.id, COALESCE(NULLIF(p.currency, ''), 'ETB'),
             pv.price, pv.compare_at_price, COALESCE(pv.created_at, NOW()), NOW(), NOW()
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.price IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM variant_prices vp
          WHERE vp.variant_id = pv.id
            AND vp.currency = COALESCE(NULLIF(p.currency, ''), 'ETB')
            AND vp.valid_until IS NULL
        )
    `);
    console.log('Catalog migration complete. Existing warehouses and operational tables were preserved.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Catalog migration failed:', error);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
})();
