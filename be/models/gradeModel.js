const pool = require('../config/db');

async function findTeacherId(userId) {
  const [rows] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
  return rows[0] && rows[0].id;
}

async function findOffering(id) {
  const [rows] = await pool.query('SELECT id, teacher_id FROM course_offerings WHERE id = ?', [id]);
  return rows[0];
}

async function getMeta() {
  const [semesters] = await pool.query('SELECT id, semester_code, semester_name, academic_year, status FROM semesters ORDER BY start_date');
  const [subjects] = await pool.query('SELECT id, subject_code, subject_name, credits FROM subjects ORDER BY subject_code');
  const [classes] = await pool.query('SELECT id, class_code, class_name FROM classes ORDER BY class_code');
  return { semesters, subjects, classes };
}

async function getOfferings(user, semesterId) {
  const where = []; const params = [];
  if (user.role === 'TEACHER') { where.push('t.user_id = ?'); params.push(user.id); }
  if (semesterId) { where.push('o.semester_id = ?'); params.push(semesterId); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [rows] = await pool.query(
    `SELECT o.id, sb.subject_code, sb.subject_name, sb.credits, sm.semester_name, t.full_name AS teacher_name, o.room, o.schedule,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_offering_id = o.id) AS enrolled
     FROM course_offerings o JOIN subjects sb ON sb.id=o.subject_id JOIN semesters sm ON sm.id=o.semester_id JOIN teachers t ON t.id=o.teacher_id
     ${clause} ORDER BY sb.subject_code`, params);
  return rows;
}

async function getOfferingStudents(id) {
  const [rows] = await pool.query(
    `SELECT e.id AS enrollment_id, s.student_code, s.full_name, g.id AS grade_id, g.attendance_score, g.midterm_score, g.final_score, g.total_score, g.letter_grade, g.result
     FROM enrollments e JOIN students s ON s.id=e.student_id LEFT JOIN grades g ON g.enrollment_id=e.id
     WHERE e.course_offering_id = ? ORDER BY s.student_code`, [id]);
  return rows;
}

async function findStudentByCode(code) {
  const [rows] = await pool.query('SELECT id FROM students WHERE student_code = ?', [code]);
  return rows[0];
}

async function createEnrollment(studentId, offeringId) {
  await pool.query('INSERT INTO enrollments (student_id, course_offering_id, enrollment_date) VALUES (?,?,CURDATE())', [studentId, offeringId]);
}

async function findEnrollmentOffering(id) {
  const [rows] = await pool.query('SELECT course_offering_id FROM enrollments WHERE id = ?', [id]);
  return rows[0];
}

async function findGradeOffering(id) {
  const [rows] = await pool.query('SELECT e.course_offering_id FROM grades g JOIN enrollments e ON e.id=g.enrollment_id WHERE g.id=?', [id]);
  return rows[0];
}

async function deleteGrade(id) {
  await pool.query('DELETE FROM grades WHERE id = ?', [id]);
}

async function getHistory(id) {
  const [rows] = await pool.query(
    `SELECT h.old_score, h.new_score, h.old_result, h.new_result, u.full_name AS changed_by, h.reason, h.changed_at
     FROM grade_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.grade_id = ? ORDER BY h.changed_at DESC, h.id DESC`, [id]);
  return rows;
}

async function listGrades({ query, semesterId, subjectId, classId, result, page, limit }) {
  const where = []; const params = [];
  if (query) { where.push('(st.student_code LIKE ? OR st.full_name LIKE ?)'); params.push(`%${query}%`, `%${query}%`); }
  if (semesterId) { where.push('o.semester_id = ?'); params.push(semesterId); }
  if (subjectId) { where.push('o.subject_id = ?'); params.push(subjectId); }
  if (classId) { where.push('st.class_id = ?'); params.push(classId); }
  if (['PASSED', 'FAILED'].includes(result)) { where.push('g.result = ?'); params.push(result); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const from = `FROM grades g JOIN enrollments e ON e.id=g.enrollment_id JOIN students st ON st.id=e.student_id
    JOIN course_offerings o ON o.id=e.course_offering_id JOIN subjects sb ON sb.id=o.subject_id JOIN semesters sm ON sm.id=o.semester_id
    JOIN teachers t ON t.id=o.teacher_id`;
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${from} ${clause}`, params);
  const [rows] = await pool.query(
    `SELECT g.id, st.student_code, st.full_name, sb.subject_code, sb.subject_name, sb.credits, sm.semester_name, t.full_name AS teacher_name,
            g.total_score, g.letter_grade, g.result, g.updated_at,
            (SELECT COUNT(*) FROM grade_history h WHERE h.grade_id = g.id) AS edits
     ${from} ${clause} ORDER BY g.updated_at DESC, g.id DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
}

async function findImportStudent(conn, code) {
  const [rows] = await conn.query('SELECT id FROM students WHERE student_code=?', [code]);
  return rows[0];
}

async function findImportSubject(conn, code) {
  const [rows] = await conn.query('SELECT id FROM subjects WHERE subject_code=?', [code]);
  return rows[0];
}

async function findImportSemester(conn, name) {
  const [rows] = await conn.query('SELECT id FROM semesters WHERE semester_name=? OR semester_code=?', [name, name]);
  return rows[0];
}

async function findImportOffering(conn, { studentId, subjectId, semesterId, teacherId }) {
  const [rows] = await conn.query(
    `SELECT o.id, (SELECT e.id FROM enrollments e WHERE e.course_offering_id=o.id AND e.student_id=?) AS enrollment_id
     FROM course_offerings o WHERE o.subject_id=? AND o.semester_id=? ${teacherId ? 'AND o.teacher_id=?' : ''}
     ORDER BY enrollment_id IS NULL, o.id`, teacherId ? [studentId, subjectId, semesterId, teacherId] : [studentId, subjectId, semesterId]);
  return rows;
}

async function createImportEnrollment(conn, studentId, offeringId) {
  const [rows] = await conn.query('INSERT INTO enrollments (student_id, course_offering_id, enrollment_date) VALUES (?,?,CURDATE())', [studentId, offeringId]);
  return rows.insertId;
}

module.exports = {
  findTeacherId, findOffering, getMeta, getOfferings, getOfferingStudents,
  findStudentByCode, createEnrollment, findEnrollmentOffering, findGradeOffering,
  deleteGrade, getHistory, listGrades, findImportStudent, findImportSubject,
  findImportSemester, findImportOffering, createImportEnrollment,
};