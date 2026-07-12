const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('❌ JWT_SECRET is not set in environment variables');
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
