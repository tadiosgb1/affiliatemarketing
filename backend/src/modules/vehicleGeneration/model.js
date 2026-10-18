module.exports = (sequelize, D) => sequelize.define('VehicleGeneration', {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  modelId: { type: D.UUID, allowNull: false },
  generationName: { type: D.STRING(150) },
  yearFrom: { type: D.SMALLINT, validate: { min: 1886, max: 2200 } },
  yearTo: { type: D.SMALLINT, validate: { min: 1886, max: 2200 } },
  bodyStyle: { type: D.STRING(100) },
}, { tableName: 'vehicle_generations', indexes: [{ fields: ['model_id'] }] });