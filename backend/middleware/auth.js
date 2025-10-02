const jwt = require('jsonwebtoken');
const dbService = require('../services/dbService');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const getGoogleTokens = async (userId) => {
  const user = await dbService.getUserById(userId);
  return user ? {
    accessToken: user.access_token,
    refreshToken: user.refresh_token
  } : null;
};

module.exports = { authenticateToken, getGoogleTokens };