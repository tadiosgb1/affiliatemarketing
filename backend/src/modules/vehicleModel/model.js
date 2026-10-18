module.exports = (sequelize, D) => sequelize.define('VehicleModel', {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  makeId: { type: D.UUID, allowNull: false },
  name: { type: D.STRING(150), allowNull: false },
}, { tableName: 'vehicle_models', indexes: [{ unique: true, fields: ['make_id', 'name'] }] });