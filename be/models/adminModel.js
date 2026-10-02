const pool = require('../config/db');

async function listUsers({ query, role, page, limit }) {
  const where = []; const params = [];
  if (query) { where.push('(username LIKE ? OR full_name LIKE ?)'); params.push(`%${query}%`, `%${query}%`); }
  if (role) { where.push('role = ?'); params.push(role); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${clause}`, params);
  const [rows] = await pool.query(`SELECT id, username, full_name, email, role, is_active, created_at FROM users ${clause} ORDER BY id LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
}

async function setActive(id, active) {
  const [result] = await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [active, id]);
  return result.affectedRows;
}

async function findRole(id) {
  const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
  return rows[0] && rows[0].role;
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

module.exports = { listUsers, setActive, findRole, updatePassword };