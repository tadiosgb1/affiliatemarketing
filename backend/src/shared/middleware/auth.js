const jwt = require('jsonwebtoken')
const { User } = require('../../database/models')

async function requireAuth(req, res, next) {
  const authorization = String(req.headers.authorization || '').trim()
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required. Please sign in again.' })
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Authentication cannot verify tokens.')
    return res.status(500).json({ success: false, code: 'AUTH_CONFIG_ERROR', message: 'Authentication is not configured on the server. Set JWT_SECRET in backend/.env and restart the backend.' })
  }

  let payload
  try {
    payload = jwt.verify(match[1].trim(), process.env.JWT_SECRET)
  } catch (error) {
    if (error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Your session has expired. Please sign in again.' })
    }
    if (error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, code: 'TOKEN_INVALID', message: 'Your session token is invalid. Please sign in again.' })
    }
    console.error('Unexpected JWT verification error:', error)
    return res.status(500).json({ success: false, code: 'AUTH_VERIFY_ERROR', message: 'The server could not verify your session.' })
  }

  if (!payload || !payload.sub) {
    return res.status(401).json({ success: false, code: 'TOKEN_INVALID', message: 'Your session token is missing its user identity. Please sign in again.' })
  }

  try {
    const user = await User.findByPk(payload.sub)
    if (!user || user.isActive === false) {
      return res.status(401).json({ success: false, code: 'ACCOUNT_INACTIVE', message: 'This account is unavailable. Please contact an administrator.' })
    }
    req.user = user
    return next()
  } catch (error) {
    console.error('Failed to load authenticated user:', error)
    return res.status(500).json({ success: false, code: 'AUTH_USER_LOOKUP_FAILED', message: 'The server could not load your account. Check the database connection.' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ success: false, code: 'INSUFFICIENT_ROLE', message: 'Your account does not have permission to access this resource.' })
}

module.exports = { requireAuth, requireRole }
