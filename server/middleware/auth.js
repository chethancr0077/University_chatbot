const jwt = require('jsonwebtoken');
const { dbGet } = require('../../database/db');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? ''
  : 'unimate-ai-local-development-secret');

if (!JWT_SECRET) {
  throw new Error('Set JWT_SECRET to a long, random value before running in production or on Vercel.');
}

// Middleware to authenticate token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbGet('SELECT user_id, username, email, role FROM users WHERE user_id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = user;

    // Attach student or faculty profile if available
    if (user.role === 'student') {
      const student = await dbGet(
        `SELECT s.*, s.usn AS srn, d.name as dept_name, d.code as dept_code 
         FROM students s 
         JOIN departments d ON s.dept_id = d.dept_id 
         WHERE s.user_id = ?`,
        [user.user_id]
      );
      req.student = student;
    } else if (user.role === 'faculty') {
      const faculty = await dbGet(
        `SELECT f.*, f.employee_id AS srn, d.name as dept_name, d.code as dept_code 
         FROM faculty f 
         JOIN departments d ON f.dept_id = d.dept_id 
         WHERE f.user_id = ?`,
        [user.user_id]
      );
      req.faculty = faculty;
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

// Optional auth for public exploration (no silent mock)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await dbGet('SELECT user_id, username, email, role FROM users WHERE user_id = ?', [decoded.userId]);
      if (user) {
        req.user = user;
        if (user.role === 'student') {
          req.student = await dbGet(
            `SELECT s.*, s.usn AS srn, d.name as dept_name, d.code as dept_code FROM students s JOIN departments d ON s.dept_id = d.dept_id WHERE s.user_id = ?`,
            [user.user_id]
          );
        } else if (user.role === 'faculty') {
          req.faculty = await dbGet(
            `SELECT f.*, f.employee_id AS srn, d.name as dept_name, d.code as dept_code FROM faculty f JOIN departments d ON f.dept_id = d.dept_id WHERE f.user_id = ?`,
            [user.user_id]
          );
        }
      }
    } catch (e) {
      // Ignore token decode failure in optional auth
    }
  }

  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user ? req.user.role : 'unauthenticated'}`
      });
    }
    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  generateToken,
  JWT_SECRET
};
