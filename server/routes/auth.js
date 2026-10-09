const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbGet } = require('../../database/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login (SRN / ID Authentication)
router.post('/login', async (req, res) => {
  try {
    const rawSrn = req.body.srn || req.body.identifier || req.body.email;
    const { password } = req.body;

    if (!rawSrn || !password) {
      return res.status(400).json({ error: 'SRN / ID and password are required.' });
    }

    const cleanSrn = rawSrn.trim().toUpperCase();

    // 1. Try finding Student by SRN / USN
    let student = await dbGet(
      `SELECT s.*, s.usn AS srn, d.name AS dept_name, d.code AS dept_code 
       FROM students s 
       JOIN departments d ON s.dept_id = d.dept_id 
       WHERE UPPER(s.usn) = ?`,
      [cleanSrn]
    );

    let user = null;
    let profile = null;

    if (student) {
      user = await dbGet('SELECT * FROM users WHERE user_id = ?', [student.user_id]);
      profile = student;
    }

    // 2. Try finding Faculty by Employee ID / Faculty SRN
    if (!user) {
      const faculty = await dbGet(
        `SELECT f.*, f.employee_id AS srn, d.name AS dept_name, d.code AS dept_code 
         FROM faculty f 
         JOIN departments d ON f.dept_id = d.dept_id 
         WHERE UPPER(f.employee_id) = ?`,
        [cleanSrn]
      );
      if (faculty) {
        user = await dbGet('SELECT * FROM users WHERE user_id = ?', [faculty.user_id]);
        profile = faculty;
      }
    }

    // 3. Try finding Admin or User by Username / Email
    if (!user) {
      user = await dbGet(
        `SELECT * FROM users WHERE UPPER(username) = ? OR LOWER(email) = ?`,
        [cleanSrn, cleanSrn.toLowerCase()]
      );

      if (user) {
        if (user.role === 'admin') {
          profile = {
            full_name: 'University Registrar',
            srn: user.username,
            role: 'admin',
            email: user.email,
            designation: 'Dean of Academics & Registrar'
          };
        } else if (user.role === 'student') {
          profile = await dbGet(
            `SELECT s.*, s.usn AS srn, d.name AS dept_name, d.code AS dept_code 
             FROM students s 
             JOIN departments d ON s.dept_id = d.dept_id 
             WHERE s.user_id = ?`,
            [user.user_id]
          );
        } else if (user.role === 'faculty') {
          profile = await dbGet(
            `SELECT f.*, f.employee_id AS srn, d.name AS dept_name, d.code AS dept_code 
             FROM faculty f 
             JOIN departments d ON f.dept_id = d.dept_id 
             WHERE f.user_id = ?`,
            [user.user_id]
          );
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: `SRN / ID "${cleanSrn}" not found in university records.` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please verify your credentials.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        srn: profile ? profile.srn : user.username,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (err) {
    console.error('SRN Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// POST /api/auth/demo-login (1-Click quick sign in using demo role SRNs)
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body;
    let targetSrn = '1MS21CS001'; // Default student SRN

    if (role === 'faculty') targetSrn = 'FAC-CSE-001';
    else if (role === 'admin') targetSrn = 'ADMIN-001';

    // Call login internally with default demo password
    let user = null;
    let profile = null;

    if (role === 'student') {
      const student = await dbGet(
        `SELECT s.*, s.usn AS srn, d.name AS dept_name, d.code AS dept_code 
         FROM students s 
         JOIN departments d ON s.dept_id = d.dept_id 
         WHERE UPPER(s.usn) = ?`,
        [targetSrn]
      );
      if (student) {
        user = await dbGet('SELECT * FROM users WHERE user_id = ?', [student.user_id]);
        profile = student;
      }
    } else if (role === 'faculty') {
      const faculty = await dbGet(
        `SELECT f.*, f.employee_id AS srn, d.name AS dept_name, d.code AS dept_code 
         FROM faculty f 
         JOIN departments d ON f.dept_id = d.dept_id 
         WHERE UPPER(f.employee_id) = ?`,
        [targetSrn]
      );
      if (faculty) {
        user = await dbGet('SELECT * FROM users WHERE user_id = ?', [faculty.user_id]);
        profile = faculty;
      }
    } else {
      user = await dbGet(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
      if (user) {
        profile = {
          full_name: 'University Registrar',
          srn: 'ADMIN-001',
          role: 'admin',
          email: user.email,
          designation: 'Dean of Academics & Registrar'
        };
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo account not found.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        srn: profile ? profile.srn : user.username,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me (Verify active SRN session)
router.get('/me', authenticateToken, (req, res) => {
  const profile = req.student || req.faculty || null;
  res.json({
    user: {
      userId: req.user.user_id,
      username: req.user.username,
      srn: profile ? (profile.srn || profile.usn || profile.employee_id) : req.user.username,
      email: req.user.email,
      role: req.user.role
    },
    profile
  });
});

module.exports = router;
