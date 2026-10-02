const pool = require('../config/db');

const BASE = `FROM students s JOIN classes c ON c.id=s.class_id JOIN majors m ON m.id=c.major_id JOIN departments d ON d.id=m.department_id`;
const COLS = `s.id, s.student_code, s.full_name, s.date_of_birth, s.gender, s.class_id, s.email, s.phone, s.address, s.admission_year, s.status,
  c.class_code, m.major_name, d.department_name`;

async function getTranscript(studentId, semesterId) {
  const params = [studentId];
  let extra = '';
  if (semesterId) { extra = ' AND sm.id = ?'; params.push(semesterId); }
  const [grades] = await pool.query(
    `SELECT g.id AS grade_id, sb.subject_code, sb.subject_name, sb.credits, sm.id AS semester_id, sm.semester_name, sm.academic_year,
            t.full_name AS teacher_name, g.attendance_score, g.midterm_score, g.final_score, g.total_score, g.letter_grade, g.result
     FROM enrollments e
     JOIN grades g ON g.enrollment_id = e.id
     JOIN course_offerings o ON o.id = e.course_offering_id
     JOIN subjects sb ON sb.id = o.subject_id
     JOIN semesters sm ON sm.id = o.semester_id
     JOIN teachers t ON t.id = o.teacher_id
     WHERE e.student_id = ?${extra}
     ORDER BY sm.start_date, sb.subject_code`, params);
  let credits = 0, weighted = 0, passedCredits = 0, failed = 0;
  for (const grade of grades) {
    credits += grade.credits; weighted += grade.total_score * grade.credits;
    if (grade.result === 'PASSED') passedCredits += grade.credits; else failed++;
  }
  const summary = { subjects: grades.length, credits, passed_credits: passedCredits, failed_subjects: failed,
    gpa: credits ? Math.round(weighted / credits * 100) / 100 : null };
  return { grades, summary };
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${COLS} ${BASE} WHERE s.id = ?`, [id]);
  return rows[0];
}

async function findIdByUserId(userId) {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows[0] && rows[0].id;
}

async function list({ query, classId, status, page, limit }) {
  const where = []; const params = [];
  if (query) { where.push('(s.student_code LIKE ? OR s.full_name LIKE ?)'); params.push(`%${query}%`, `%${query}%`); }
  if (classId) { where.push('s.class_id = ?'); params.push(classId); }
  if (status) { where.push('s.status = ?'); params.push(status); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${BASE} ${clause}`, params);
  const [rows] = await pool.query(`SELECT ${COLS} ${BASE} ${clause} ORDER BY s.student_code LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
}

async function create(conn, { student, username, passwordHash }) {
  const [user] = await conn.query(`INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?,?,?,?, 'STUDENT')`,
    [username, passwordHash, student.full_name, student.email || null]);
  const [created] = await conn.query(
    `INSERT INTO students (student_code, user_id, full_name, date_of_birth, gender, class_id, email, phone, address, admission_year, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [student.student_code, user.insertId, student.full_name, student.date_of_birth, student.gender || 'OTHER', student.class_id, student.email || null, student.phone || null, student.address || null, student.admission_year, student.status || 'ACTIVE']);
  return created.insertId;
}

async function update(id, student) {
  const [result] = await pool.query(
    `UPDATE students SET full_name=?, date_of_birth=?, gender=?, class_id=?, email=?, phone=?, address=?, admission_year=?, status=? WHERE id=?`,
    [student.full_name, student.date_of_birth, student.gender || 'OTHER', student.class_id, student.email || null, student.phone || null, student.address || null, student.admission_year, student.status || 'ACTIVE', id]);
  if (result.affectedRows) await pool.query('UPDATE users u JOIN students s ON s.user_id=u.id SET u.full_name=? WHERE s.id=?', [student.full_name, id]);
  return result.affectedRows;
}

async function findUserId(id) {
  const [rows] = await pool.query('SELECT user_id FROM students WHERE id=?', [id]);
  return rows[0] && rows[0].user_id;
}

async function deleteUser(userId) {
  await pool.query('DELETE FROM users WHERE id=?', [userId]);
}

module.exports = { getTranscript, findById, findIdByUserId, list, create, update, findUserId, deleteUser };