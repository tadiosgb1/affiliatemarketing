const multer = require('multer')
const fs = require('fs')
const path = require('path')

const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = (path.extname(file.originalname || '').toLowerCase().match(/^\.(jpe?g|png|webp|gif)$/) || ['.jpg'])[0]
    callback(null, Date.now() + '-' + Math.random().toString(36).slice(2, 10) + extension)
  },
})
const fileFilter = (_req, file, callback) => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
    const error = new Error('Upload a JPG, PNG, WEBP or GIF image.')
    error.status = 400
    return callback(error)
  }
  callback(null, true)
}
module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1 } })
