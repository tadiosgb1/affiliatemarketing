module.exports = (sequelize, D) => sequelize.define('VehicleMake', {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  name: { type: D.STRING(150), allowNull: false, unique: true },
}, { tableName: 'vehicle_makes' });