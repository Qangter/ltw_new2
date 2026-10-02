const XLSX = require('xlsx');
const pool = require('../config/db');
const { HttpError, parseScore } = require('../utils/grade');
const { saveGrade } = require('../services/gradeService');
const gradeModel = require('../models/gradeModel');

async function teacherIdOf(userId) {
  return gradeModel.findTeacherId(userId);
}

async function assertOfferingAccess(user, offeringId) {
  const offering = await gradeModel.findOffering(offeringId);
  if (!offering) throw new HttpError(404, 'Không tìm thấy lớp học phần');
  if (user.role === 'TEACHER' && offering.teacher_id !== (await teacherIdOf(user.id))) throw new HttpError(403, 'Đây không phải lớp học phần của bạn');
  return offering;
}

async function meta(req, res) {
  res.json(await gradeModel.getMeta());
}

async function offerings(req, res) {
  res.json(await gradeModel.getOfferings(req.user, req.query.semester_id));
}

async function offeringStudents(req, res) {
  await assertOfferingAccess(req.user, req.params.id);
  res.json(await gradeModel.getOfferingStudents(req.params.id));
}

async function enroll(req, res) {
  await assertOfferingAccess(req.user, req.params.id);
  const code = String((req.body || {}).student_code || '').trim();
  const student = await gradeModel.findStudentByCode(code);
  if (!student) throw new HttpError(404, `Không tìm thấy sinh viên ${code}`);
  try {
    await gradeModel.createEnrollment(student.id, req.params.id);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Sinh viên đã đăng ký lớp học phần này');
    throw error;
  }
  res.status(201).json({ message: 'Đã thêm sinh viên vào lớp học phần' });
}

async function updateGrade(req, res) {
  const enrollment = await gradeModel.findEnrollmentOffering(req.params.enrollmentId);
  if (!enrollment) throw new HttpError(404, 'Không tìm thấy lượt đăng ký');
  await assertOfferingAccess(req.user, enrollment.course_offering_id);
  const body = req.body || {};
  const attendance = parseScore(body.attendance_score, 'Điểm chuyên cần', false);
  const midterm = parseScore(body.midterm_score, 'Điểm giữa kỳ', false);
  const final = parseScore(body.final_score, 'Điểm cuối kỳ', true);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await saveGrade(conn, { enrollmentId: req.params.enrollmentId, attendance, midterm, final, userId: req.user.id, reason: body.reason });
    await conn.commit();
    res.json(result);
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
}

async function deleteGrade(req, res) {
  const grade = await gradeModel.findGradeOffering(req.params.id);
  if (!grade) throw new HttpError(404, 'Không tìm thấy điểm');
  await assertOfferingAccess(req.user, grade.course_offering_id);
  await gradeModel.deleteGrade(req.params.id);
  res.json({ message: 'Đã xóa điểm' });
}

async function gradeHistory(req, res) {
  res.json(await gradeModel.getHistory(req.params.id));
}

async function listGrades(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
  res.json(await gradeModel.listGrades({
    query: req.query.q,
    semesterId: req.query.semester_id,
    subjectId: req.query.subject_id,
    classId: req.query.class_id,
    result: req.query.result,
    page,
    limit,
  }));
}

function importTemplate(req, res) {
  const headers = ['student_code', 'full_name', 'subject_code', 'subject_name', 'credits', 'semester_name', 'academic_year', 'score'];
  const sheet = XLSX.utils.aoa_to_sheet([headers, ['SV0001', 'Nguyễn Văn An', 'IT001', 'Lập trình C++', 3, 'Học kỳ 1 năm học 2024-2025', '2024-2025', 8.5]]);
  sheet['!cols'] = headers.map(() => ({ wch: 22 }));
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Grades');
  res.setHeader('Content-Disposition', 'attachment; filename="excel_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

async function importGrades(req, res) {
  if (!req.file) throw new HttpError(400, 'Vui lòng chọn file Excel (.xlsx)');
  let rows;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  } catch { throw new HttpError(400, 'Không đọc được file Excel'); }
  if (!rows.length) throw new HttpError(400, 'File không có dữ liệu');
  const missing = ['student_code', 'subject_code', 'semester_name', 'score'].filter(header => !(header in rows[0]));
  if (missing.length) throw new HttpError(400, `File thiếu cột: ${missing.join(', ')}`);
  if (rows.length > 5000) throw new HttpError(400, 'Tối đa 5000 dòng mỗi lần import');

  const teacherId = req.user.role === 'TEACHER' ? await teacherIdOf(req.user.id) : null;
  const errors = []; let created = 0, updated = 0;
  const conn = await pool.getConnection();
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]; const line = i + 2;
      try {
        const code = String(row.student_code).trim(), subjectCode = String(row.subject_code).trim(), semesterName = String(row.semester_name).trim();
        if (!code || !subjectCode || !semesterName) throw new Error('Thiếu mã sinh viên, mã môn hoặc học kỳ');
        const score = parseScore(row.score, 'Điểm', true);
        const student = await gradeModel.findImportStudent(conn, code);
        if (!student) throw new Error(`Không có sinh viên ${code}`);
        const subject = await gradeModel.findImportSubject(conn, subjectCode);
        if (!subject) throw new Error(`Không có môn ${subjectCode}`);
        const semester = await gradeModel.findImportSemester(conn, semesterName);
        if (!semester) throw new Error(`Không có học kỳ "${semesterName}"`);
        const offerings = await gradeModel.findImportOffering(conn, { studentId: student.id, subjectId: subject.id, semesterId: semester.id, teacherId });
        if (!offerings.length) throw new Error(teacherId ? 'Bạn không dạy môn này trong học kỳ đó' : 'Môn này chưa mở trong học kỳ đó');
        await conn.beginTransaction();
        let enrollmentId = offerings[0].enrollment_id;
        if (!enrollmentId) {
          enrollmentId = await gradeModel.createImportEnrollment(conn, student.id, offerings[0].id);
        }
        const result = await saveGrade(conn, { enrollmentId, attendance: null, midterm: null, final: score, userId: req.user.id, reason: 'Import từ file Excel' });
        await conn.commit();
        result.created ? created++ : updated++;
      } catch (error) {
        try { await conn.rollback(); } catch {}
        errors.push({ row: line, message: error.message });
      }
    }
  } finally { conn.release(); }
  res.json({ total: rows.length, created, updated, failed: errors.length, errors: errors.slice(0, 100) });
}

module.exports = { meta, offerings, offeringStudents, enroll, updateGrade, deleteGrade, gradeHistory, listGrades, importTemplate, importGrades };