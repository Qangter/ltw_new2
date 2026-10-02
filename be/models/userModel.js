const pool = require('../config/db');

async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await pool.query('SELECT id, username, full_name, email, role FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function findStudentByUserId(userId) {
  const [rows] = await pool.query('SELECT id, student_code FROM students WHERE user_id = ?', [userId]);
  return rows[0];
}

async function findPasswordById(id) {
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

module.exports = { findByUsername, findById, findStudentByUserId, findPasswordById, updatePassword };