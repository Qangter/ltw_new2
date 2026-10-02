const bcrypt = require('bcryptjs');
const { HttpError } = require('../utils/grade');
const adminModel = require('../models/adminModel');

async function listUsers(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  res.json(await adminModel.listUsers({
    query: req.query.q,
    role: ['ADMIN', 'TEACHER', 'STUDENT'].includes(req.query.role) ? req.query.role : null,
    page,
    limit: 15,
  }));
}

async function setActive(req, res) {
  if (Number(req.params.id) === req.user.id) throw new HttpError(400, 'Không thể khóa chính tài khoản của bạn');
  const active = req.body && req.body.is_active ? 1 : 0;
  if (!await adminModel.setActive(req.params.id, active)) throw new HttpError(404, 'Không tìm thấy người dùng');
  res.json({ message: active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' });
}

async function resetPassword(req, res) {
  const role = await adminModel.findRole(req.params.id);
  if (!role) throw new HttpError(404, 'Không tìm thấy người dùng');
  const password = { ADMIN: 'admin123', TEACHER: 'teacher123', STUDENT: 'student123' }[role];
  await adminModel.updatePassword(req.params.id, await bcrypt.hash(password, 10));
  res.json({ message: `Đã đặt lại mật khẩu về mặc định (${password})` });
}

module.exports = { listUsers, setActive, resetPassword };