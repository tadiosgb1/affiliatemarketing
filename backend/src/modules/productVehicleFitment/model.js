module.exports = (sequelize, D) => sequelize.define('ProductVehicleFitment', {
  productId: { type: D.UUID, allowNull: false, primaryKey: true },
  vehicleGenerationId: { type: D.UUID, allowNull: false, primaryKey: true },
  notes: { type: D.TEXT },
}, { tableName: 'product_vehicle_fitments', indexes: [{ fields: ['vehicle_generation_id'] }] });