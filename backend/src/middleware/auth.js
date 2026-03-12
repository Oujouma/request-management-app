const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get the token from the request header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token, please log in' });
  }

  try {
    // Verify the token is real and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token, please log in again' });
  }
};

module.exports = authMiddleware;