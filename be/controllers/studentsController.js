const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { HttpError } = require('../utils/grade');
const studentModel = require('../models/studentModel');

async function myTranscript(req, res) {
  const id = await studentModel.findIdByUserId(req.user.id);
  if (!id) throw new HttpError(404, 'Không tìm thấy hồ sơ sinh viên');
  res.json({ student: await studentModel.findById(id), ...(await studentModel.getTranscript(id, req.query.semester_id)) });
}

async function list(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  res.json(await studentModel.list({ query: req.query.q, classId: req.query.class_id, status: req.query.status, page, limit }));
}

async function transcript(req, res) {
  const student = await studentModel.findById(req.params.id);
  if (!student) throw new HttpError(404, 'Không tìm thấy sinh viên');
  res.json({ student, ...(await studentModel.getTranscript(student.id, req.query.semester_id)) });
}

function validateStudent(body, isCreate) {
  if (!body.full_name || !body.class_id || !body.date_of_birth || !body.admission_year) throw new HttpError(400, 'Thiếu họ tên, lớp, ngày sinh hoặc năm nhập học');
  if (isCreate && !/^[A-Za-z0-9]{3,30}$/.test(body.student_code || '')) throw new HttpError(400, 'Mã sinh viên gồm 3-30 chữ/số, không dấu');
  if (!['MALE', 'FEMALE', 'OTHER'].includes(body.gender || 'OTHER')) throw new HttpError(400, 'Giới tính không hợp lệ');
  if (!['ACTIVE', 'GRADUATED', 'SUSPENDED'].includes(body.status || 'ACTIVE')) throw new HttpError(400, 'Trạng thái không hợp lệ');
}

async function create(req, res) {
  const body = req.body || {}; validateStudent(body, true);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const username = String(body.student_code).toLowerCase();
    const passwordHash = await bcrypt.hash(body.password || 'student123', 10);
    const id = await studentModel.create(conn, { student: body, username, passwordHash });
    await conn.commit();
    res.status(201).json({ id, message: `Đã thêm sinh viên. Tài khoản: ${username}` });
  } catch (error) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Mã sinh viên hoặc tên đăng nhập đã tồn tại');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') throw new HttpError(400, 'Lớp không tồn tại');
    throw error;
  } finally { conn.release(); }
}

async function update(req, res) {
  const body = req.body || {}; validateStudent(body, false);
  if (!await studentModel.update(req.params.id, body)) throw new HttpError(404, 'Không tìm thấy sinh viên');
  res.json({ message: 'Đã cập nhật sinh viên' });
}

async function remove(req, res) {
  const userId = await studentModel.findUserId(req.params.id);
  if (!userId) throw new HttpError(404, 'Không tìm thấy sinh viên');
  try {
    await studentModel.deleteUser(userId);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') throw new HttpError(409, 'Sinh viên đã có dữ liệu đăng ký/điểm, không thể xóa. Hãy đổi trạng thái thay vì xóa.');
    throw error;
  }
  res.json({ message: 'Đã xóa sinh viên' });
}

module.exports = { myTranscript, list, transcript, create, update, remove };