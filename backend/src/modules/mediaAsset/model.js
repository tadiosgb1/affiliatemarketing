module.exports = (sequelize, D) => sequelize.define('MediaAsset', {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  mediaType: { type: D.ENUM('image', 'video', 'document', 'audio', 'other'), allowNull: false },
  storageUrl: { type: D.TEXT, allowNull: false },
  thumbnailUrl: { type: D.TEXT },
  mimeType: { type: D.STRING(150) },
  fileName: { type: D.STRING(300) },
  fileSizeBytes: { type: D.BIGINT, validate: { min: 0 } },
  width: { type: D.INTEGER, validate: { min: 0 } },
  height: { type: D.INTEGER, validate: { min: 0 } },
  durationSeconds: { type: D.DECIMAL(12, 3), validate: { min: 0 } },
  altText: { type: D.TEXT },
  metadata: { type: D.JSON, allowNull: false },
}, { tableName: 'media_assets', indexes: [{ fields: ['media_type'] }] });