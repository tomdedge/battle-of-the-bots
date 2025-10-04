const jwt = require('jsonwebtoken');

const authenticateSocket = (socket, next) => {
  let token = socket.handshake.auth.token;
  
  // If no token in auth, check for httpOnly cookie (production)
  if (!token && socket.handshake.headers.cookie) {
    const cookies = socket.handshake.headers.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = user;
    next();
  });
};

module.exports = { authenticateSocket };