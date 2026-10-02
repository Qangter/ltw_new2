const bcrypt = require('bcryptjs');
const { sign } = require('../middleware/auth');
const { HttpError } = require('../utils/grade');
const userModel = require('../models/userModel');

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) throw new HttpError(400, 'Vui lòng nhập tên đăng nhập và mật khẩu');
  const user = await userModel.findByUsername(String(username).trim());
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu');
  if (!user.is_active) throw new HttpError(403, 'Tài khoản đã bị khóa');
  res.json({ token: sign(user), user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
}

async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Tài khoản không tồn tại');
  if (user.role === 'STUDENT') {
    const student = await userModel.findStudentByUserId(user.id);
    user.student_id = student && student.id; user.student_code = student && student.student_code;
  }
  res.json(user);
}

async function changePassword(req, res) {
  const { old_password, new_password } = req.body || {};
  if (!new_password || String(new_password).length < 6) throw new HttpError(400, 'Mật khẩu mới phải từ 6 ký tự');
  const user = await userModel.findPasswordById(req.user.id);
  if (!user || !(await bcrypt.compare(String(old_password || ''), user.password_hash))) throw new HttpError(400, 'Mật khẩu cũ không đúng');
  await userModel.updatePassword(req.user.id, await bcrypt.hash(String(new_password), 10));
  res.json({ message: 'Đổi mật khẩu thành công' });
}

module.exports = { login, me, changePassword };