/* Website tra cứu kết quả thi trực tuyến - SPA (JS thuần, không chứa HTML) */
'use strict';

// ===================== TIỆN ÍCH CHUNG =====================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const num = (n) => (n === null || n === undefined ? '—' : String(Math.round(Number(n) * 100) / 100));
const fmtDate = (s) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '');
const ROLE = { ADMIN: 'Quản trị viên', TEACHER: 'Giáo viên', STUDENT: 'Sinh viên' };
const RESULT = { PASSED: 'Đạt', FAILED: 'Không đạt' };
const STATUS = { ACTIVE: 'Đang học', GRADUATED: 'Đã tốt nghiệp', SUSPENDED: 'Bảo lưu/Đình chỉ' };
const GENDER = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };

let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let meta = null;

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  $('#toast').appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

// ---- gọi API backend ----
async function api(path, { method = 'GET', body, form, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch('/api' + path, { method, headers, body: payload });
  if (res.status === 401 && token) { logout(false); throw new Error('Phiên đăng nhập đã hết hạn'); }
  if (raw && res.ok) return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data;
}
const qs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

function logout(redirect = true) {
  token = null; user = null; meta = null;
  localStorage.removeItem('token'); localStorage.removeItem('user');
  if (redirect) location.hash = '#/login';
  render();
}

// ===================== NẠP HTML TỪ FILE (không viết HTML trong .js) =====================
const pageCache = {};
async function loadPageHTML(name) {
  if (!pageCache[name]) pageCache[name] = await fetch(`pages/${name}.html`).then((r) => r.text());
  return pageCache[name];
}
// Nạp một trang vào phần tử `el`, trả về `el` sau khi đã gắn nội dung
async function mount(el, name) {
  el.innerHTML = await loadPageHTML(name);
  return el;
}
// Nạp modal: tạo lớp phủ + hộp thoại, gắn nội dung từ pages/modals/<name>.html
async function openModal(name) {
  const html = await loadPageHTML('modals/' + name);
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  const box = document.createElement('div');
  box.className = 'modal';
  box.innerHTML = html;
  bg.appendChild(box);
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg);
  return { bg, box };
}

// ===================== TEMPLATE HELPERS (dùng <template> trong các file .html) =====================
function clone(id) {
  return document.getElementById(id).content.cloneNode(true);
}
function setF(root, field, value) {
  const el = root.querySelector(`[data-f="${field}"]`);
  if (el) el.textContent = value ?? '';
  return el;
}
function setBadge(root, field, key, map) {
  const el = root.querySelector(`[data-f="${field}"]`);
  if (!el) return;
  el.className = 'badge ' + key;
  el.textContent = (map && map[key]) || key || '';
}
function fillOptions(select, arr, valueFn, labelFn, selected, placeholder) {
  select.innerHTML = '';
  if (placeholder !== undefined) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = placeholder;
    select.appendChild(o);
  }
  arr.forEach((item) => {
    const o = document.createElement('option');
    o.value = valueFn(item);
    o.textContent = labelFn(item);
    if (String(o.value) === String(selected ?? '')) o.selected = true;
    select.appendChild(o);
  });
}
function statCard(n, l, cls) {
  const f = clone('stat-tpl');
  if (cls) f.querySelector('.stat').classList.add(cls);
  setF(f, 'n', n); setF(f, 'l', l);
  return f;
}
function barRow(label, pct, text, cls) {
  const f = clone('bar-tpl');
  if (cls) f.querySelector('.bar').classList.add(cls);
  const lab = setF(f, 'label', label); if (lab) lab.title = label;
  const bar = f.querySelector('[data-f="bar"]'); bar.style.width = Math.min(100, pct || 0) + '%';
  setF(f, 'text', text);
  return f;
}
function renderPager(container, p, onPage) {
  container.innerHTML = '';
  if (!p) return;
  if (p.pages <= 1) {
    const f = clone('pager-total-tpl');
    f.querySelector('span').textContent = `Tổng: ${p.total} bản ghi`;
    container.appendChild(f);
    return;
  }
  const wrap = clone('pager-tpl');
  const box = wrap.querySelector('.pager');
  const total = clone('pager-total-tpl');
  total.querySelector('span').textContent = `Tổng ${p.total} bản ghi`;
  box.appendChild(total);
  const addBtn = (n, label) => {
    const b = clone('pager-btn-tpl').querySelector('button');
    b.textContent = label ?? n;
    b.dataset.page = n;
    if (n === p.page) b.classList.add('cur');
    box.appendChild(b);
  };
  const addEllipsis = () => box.appendChild(clone('pager-ellipsis-tpl'));
  if (p.page > 1) addBtn(p.page - 1, '‹');
  const from = Math.max(1, p.page - 2), to = Math.min(p.pages, p.page + 2);
  if (from > 1) { addBtn(1); if (from > 2) addEllipsis(); }
  for (let i = from; i <= to; i++) addBtn(i);
  if (to < p.pages) { if (to < p.pages - 1) addEllipsis(); addBtn(p.pages); }
  if (p.page < p.pages) addBtn(p.page + 1, '›');
  container.appendChild(wrap);
  container.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => onPage(Number(b.dataset.page))));
}
function loading(el) {
  el.innerHTML = '';
  const d = document.createElement('div');
  d.className = 'empty';
  d.textContent = 'Đang tải...';
  el.appendChild(d);
}

// ===================== MENU + ROUTER =====================
const MENU = [
  ['dashboard', 'Tổng quan', ['ADMIN', 'TEACHER']],
  ['my', 'Bảng điểm của tôi', ['STUDENT']],
  ['lookup', 'Tra cứu sinh viên', ['ADMIN', 'TEACHER']],
  ['entry', 'Nhập điểm', ['ADMIN', 'TEACHER']],
  ['import', 'Import Excel', ['ADMIN', 'TEACHER']],
  ['grades', 'Danh sách điểm', ['ADMIN', 'TEACHER']],
  ['stats', 'Thống kê đạt/rớt', ['ADMIN', 'TEACHER']],
  ['students', 'Quản lý sinh viên', ['ADMIN']],
  ['users', 'Tài khoản', ['ADMIN']],
  ['password', 'Đổi mật khẩu', ['ADMIN', 'TEACHER', 'STUDENT']],
];
// (VIEWS được định nghĩa ở cuối file, sau khi mọi hàm vXxx đã khai báo)

async function render() {
  const app = $('#app');
  const hash = location.hash.replace(/^#\/?/, '');
  const [route, param] = hash.split('/');
  if (!user) { await renderLogin(app); return; }
  const home = user.role === 'STUDENT' ? 'my' : 'dashboard';
  const page = route && route !== 'login' ? route : home;
  const items = MENU.filter((m) => m[2].includes(user.role));
  const activeKey = page === 'student' ? 'lookup' : page;
  if (!items.some((m) => m[0] === activeKey) && page !== 'student') { location.hash = '#/' + home; return; }
  if (page === 'student' && user.role === 'STUDENT') { location.hash = '#/my'; return; }

  await mount(app, 'shell');
  const nav = $('#nav');
  items.forEach((m) => {
    const a = document.createElement('a');
    a.href = '#/' + m[0];
    a.textContent = m[1];
    if (m[0] === activeKey) a.classList.add('active');
    nav.appendChild(a);
  });
  $('#user-name').textContent = user.full_name;
  $('#user-role').textContent = ROLE[user.role];
  $('#logout').addEventListener('click', (e) => { e.preventDefault(); logout(); });

  const view = $('#view');
  loading(view);
  try { await VIEWS[page](view, param); }
  catch (e) { view.innerHTML = ''; const d = document.createElement('div'); d.className = 'card empty'; d.textContent = e.message; view.appendChild(d); }
}
window.addEventListener('hashchange', render);

async function ensureMeta() { if (!meta) meta = await api('/meta'); return meta; }

// ===================== ĐĂNG NHẬP =====================
async function renderLogin(app) {
  await mount(app, 'login');
  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const r = await api('/auth/login', { method: 'POST', body: { username: f.get('username'), password: f.get('password') } });
      token = r.token; user = r.user;
      localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
      location.hash = user.role === 'STUDENT' ? '#/my' : '#/dashboard';
      render();
    } catch (err) { toast(err.message, 'err'); }
  });
}

// ===================== TỔNG QUAN =====================
async function vDashboard(v) {
  await mount(v, 'dashboard');
  $('#hi-name').textContent = user.full_name;
  const [o, sem, dist, dep] = await Promise.all([api('/stats/overview'), api('/stats/by-semester'), api('/stats/distribution'), api('/stats/by-department')]);
  const grid = $('#stat-grid');
  grid.append(
    statCard(o.students, 'Sinh viên'), statCard(o.teachers, 'Giáo viên'), statCard(o.subjects, 'Môn học'), statCard(o.classes, 'Lớp'),
    statCard(o.grades, 'Bản ghi điểm', 'warn'), statCard(num(o.avg_score), 'Điểm trung bình', 'warn'),
    statCard(o.pass_rate + '%', `Tỷ lệ đạt (${o.passed})`, 'ok'), statCard(o.fail_rate + '%', `Tỷ lệ rớt (${o.failed})`, 'bad'),
  );
  const maxDist = Math.max(...dist.map((d) => d.total), 1), maxDep = Math.max(...dep.map((d) => d.students), 1);
  const bs = $('#bar-semester'); sem.forEach((s) => bs.appendChild(barRow(s.semester_code, s.pass_rate, s.pass_rate + '%', 'ok')));
  const bd = $('#bar-distribution'); dist.forEach((d) => bd.appendChild(barRow(d.letter_grade, d.total / maxDist * 100, d.total)));
  const bp = $('#bar-department'); dep.forEach((d) => bp.appendChild(barRow(d.department_name, d.students / maxDep * 100, d.students)));
}

// ===================== BẢNG ĐIỂM (dùng chung cho SV xem mình & GV/Admin xem SV) =====================
async function showTranscript(v, loader, canBack) {
  await mount(v, 'transcript');
  const m = await ensureMeta();
  if (canBack) $('#back-link').style.display = '';
  let semId = '';

  async function draw() {
    const d = await loader(semId);
    const s = d.student, sm = d.summary;
    $('#t-name').textContent = s.full_name;
    const profile = v.querySelector('.profile');
    setF(profile, 'student_code', s.student_code);
    setF(profile, 'class_code', s.class_code);
    setF(profile, 'major_name', s.major_name);
    setF(profile, 'department_name', s.department_name);
    setF(profile, 'dob', fmtDate(s.date_of_birth));
    setF(profile, 'gender', GENDER[s.gender]);
    setF(profile, 'admission_year', s.admission_year);
    setBadge(profile, 'status', s.status, STATUS);

    const stats = $('#t-stats'); stats.innerHTML = '';
    stats.append(
      statCard(num(sm.gpa), 'Điểm TB (thang 10)'), statCard(sm.subjects, 'Số môn đã có điểm'),
      statCard(`${sm.passed_credits}/${sm.credits}`, 'Tín chỉ đạt / tổng', 'ok'), statCard(sm.failed_subjects, 'Môn không đạt', 'bad'),
    );

    fillOptions($('#semf'), m.semesters, (x) => x.id, (x) => x.semester_name, semId, 'Tất cả học kỳ');

    const body = $('#t-body'); body.innerHTML = '';
    if (!d.grades.length) { body.appendChild(clone('empty-tpl')); }
    else {
      const groups = {};
      d.grades.forEach((g) => { (groups[g.semester_name] = groups[g.semester_name] || []).push(g); });
      Object.entries(groups).forEach(([name, list]) => {
        const grp = clone('sem-group-tpl');
        setF(grp, 'title', name);
        const rows = grp.querySelector('[data-f="rows"]');
        list.forEach((g) => {
          const row = clone('grade-row-tpl');
          setF(row, 'subject_code', g.subject_code); setF(row, 'subject_name', g.subject_name); setF(row, 'credits', g.credits);
          setF(row, 'teacher_name', g.teacher_name); setF(row, 'attendance_score', num(g.attendance_score));
          setF(row, 'midterm_score', num(g.midterm_score)); setF(row, 'final_score', num(g.final_score));
          setF(row, 'total_score', num(g.total_score)); setF(row, 'letter_grade', g.letter_grade);
          setBadge(row, 'result', g.result, RESULT);
          rows.appendChild(row);
        });
        body.appendChild(grp);
      });
    }
    $('#semf').addEventListener('change', (e) => { semId = e.target.value; draw(); });
  }
  await draw();
  $('#print').addEventListener('click', () => window.print());
}
const vMy = (v) => showTranscript(v, (sem) => api('/students/me/transcript?' + qs({ semester_id: sem })), false);
const vStudent = (v, id) => showTranscript(v, (sem) => api(`/students/${id}/transcript?` + qs({ semester_id: sem })), true);

// ===================== TRA CỨU SINH VIÊN =====================
async function vLookup(v) {
  await mount(v, 'lookup');
  const m = await ensureMeta();
  fillOptions($('#sf-class'), m.classes, (c) => c.id, (c) => c.class_code, '', 'Tất cả lớp');
  const f = { q: '', class_id: '', page: 1 };

  async function load() {
    const res = $('#res'); loading(res);
    const p = await api('/students?' + qs({ ...f, limit: 10 }));
    res.innerHTML = '';
    if (!p.data.length) { res.appendChild(clone('empty-tpl')); renderPager(res, null); return; }
    const tbl = clone('table-tpl');
    const rows = tbl.querySelector('[data-f="rows"]');
    p.data.forEach((s) => {
      const row = clone('row-tpl');
      setF(row, 'student_code', s.student_code); setF(row, 'full_name', s.full_name); setF(row, 'class_code', s.class_code);
      setF(row, 'major_name', s.major_name); setF(row, 'department_name', s.department_name);
      setBadge(row, 'status', s.status, STATUS);
      row.querySelector('[data-f="link"]').href = '#/student/' + s.id;
      rows.appendChild(row);
    });
    res.appendChild(tbl);
    const pagerBox = document.createElement('div');
    res.appendChild(pagerBox);
    renderPager(pagerBox, p, (n) => { f.page = n; load(); });
  }
  $('#sf').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    f.q = d.get('q').trim(); f.class_id = d.get('class_id'); f.page = 1;
    load().catch((x) => toast(x.message, 'err'));
  });
  await load();
}

// ===================== NHẬP ĐIỂM =====================
async function vEntry(v) {
  await mount(v, 'entry');
  const m = await ensureMeta();
  const active = m.semesters.find((s) => s.status === 'ACTIVE') || m.semesters[m.semesters.length - 1];
  fillOptions($('#es'), m.semesters, (s) => s.id, (s) => s.semester_name, active.id);

  async function loadOfferings() {
    const offerings = await api('/offerings?' + qs({ semester_id: $('#es').value }));
    fillOptions($('#eo'), offerings, (o) => o.id,
      (o) => `${o.subject_code} - ${o.subject_name} (${o.enrolled} SV)${user.role === 'ADMIN' ? ' - ' + o.teacher_name : ''}`);
    const box = $('#etable'); box.innerHTML = '';
    if (offerings.length) await loadStudents(); else box.appendChild(clone('empty-offering-tpl'));
  }

  async function loadStudents() {
    const id = $('#eo').value;
    const box = $('#etable'); loading(box);
    const rows = await api(`/offerings/${id}/students`);
    box.innerHTML = '';
    const wrap = clone('entry-wrap-tpl');
    const slot = wrap.querySelector('[data-f="table-slot"]');
    if (!rows.length) slot.appendChild(clone('empty-tpl'));
    else {
      const table = clone('entry-table-tpl');
      const tbody = table.querySelector('[data-f="rows"]');
      rows.forEach((r) => {
        const tr = clone('entry-row-tpl');
        const trEl = tr.querySelector('tr');
        trEl.dataset.en = r.enrollment_id; trEl.dataset.gid = r.grade_id || '';
        setF(tr, 'student_code', r.student_code); setF(tr, 'full_name', r.full_name);
        tr.querySelector('[data-f="attendance_score"]').value = r.attendance_score ?? '';
        tr.querySelector('[data-f="midterm_score"]').value = r.midterm_score ?? '';
        tr.querySelector('[data-f="final_score"]').value = r.final_score ?? '';
        setF(tr, 'total_score', num(r.total_score)); setF(tr, 'letter_grade', r.letter_grade || '—');
        if (r.result) setBadge(tr, 'result', r.result, RESULT); else { const b = tr.querySelector('[data-f="result"]'); b.className = ''; b.textContent = '—'; }
        if (r.grade_id) tr.querySelector('.del').style.display = '';
        tbody.appendChild(tr);
      });
      slot.appendChild(table);
    }
    box.appendChild(wrap);

    async function saveRow(tr, silent) {
      const body = {};
      tr.querySelectorAll('input').forEach((i) => { body[i.dataset.f] = i.value.trim(); });
      if (body.final_score === '') { if (!silent) toast('Cần nhập điểm cuối kỳ', 'err'); return false; }
      try {
        const r = await api(`/grades/enrollment/${tr.dataset.en}`, { method: 'PUT', body: { ...body, reason: 'Cập nhật điểm thủ công' } });
        setF(tr, 'total_score', num(r.total)); setF(tr, 'letter_grade', r.letter);
        setBadge(tr, 'result', r.result, RESULT);
        tr.dataset.dirty = '';
        if (!silent) toast('Đã lưu điểm', 'ok');
        return true;
      } catch (e) { toast(`${tr.children[0].textContent}: ${e.message}`, 'err'); return false; }
    }
    box.querySelectorAll('tr[data-en]').forEach((tr) => {
      tr.querySelectorAll('input').forEach((i) => i.addEventListener('input', () => { tr.dataset.dirty = '1'; }));
      tr.querySelector('.save').addEventListener('click', () => saveRow(tr));
      const del = tr.querySelector('.del');
      del.addEventListener('click', async () => {
        if (!confirm('Xóa điểm của sinh viên này?')) return;
        try { await api('/grades/' + tr.dataset.gid, { method: 'DELETE' }); toast('Đã xóa điểm', 'ok'); loadStudents(); } catch (e) { toast(e.message, 'err'); }
      });
    });
    const sa = $('#saveall');
    if (sa) sa.addEventListener('click', async () => {
      const dirty = $$('tr[data-dirty="1"]', box);
      if (!dirty.length) return toast('Chưa có thay đổi nào');
      let ok = 0; for (const tr of dirty) if (await saveRow(tr, true)) ok++;
      toast(`Đã lưu ${ok}/${dirty.length} dòng`, ok === dirty.length ? 'ok' : 'err');
    });
    const addbtn = $('#addbtn');
    if (addbtn) addbtn.addEventListener('click', async () => {
      try { await api(`/offerings/${id}/enroll`, { method: 'POST', body: { student_code: $('#addcode').value } }); toast('Đã thêm sinh viên', 'ok'); loadStudents(); } catch (e) { toast(e.message, 'err'); }
    });
  }

  $('#es').addEventListener('change', () => loadOfferings().catch((e) => toast(e.message, 'err')));
  $('#eo').addEventListener('change', () => loadStudents().catch((e) => toast(e.message, 'err')));
  await loadOfferings();
}

// ===================== IMPORT EXCEL =====================
async function vImport(v) {
  await mount(v, 'import');
  $('#tpl').addEventListener('click', async () => {
    try {
      const b = await api('/import/template', { raw: true });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'excel_template.xlsx'; a.click();
    } catch (e) { toast(e.message, 'err'); }
  });
  $('#up').addEventListener('click', async () => {
    const file = $('#file').files[0];
    if (!file) return toast('Vui lòng chọn file Excel', 'err');
    const fd = new FormData(); fd.append('file', file);
    const box = $('#ires'); loading(box);
    try {
      const r = await api('/import/grades', { method: 'POST', form: fd });
      box.innerHTML = '';
      const f = clone('import-result-tpl');
      setF(f, 'total', r.total); setF(f, 'created', r.created); setF(f, 'updated', r.updated); setF(f, 'failed', r.failed);
      if (r.errors.length) {
        const wrap = f.querySelector('[data-f="errors-wrap"]'); wrap.style.display = '';
        const tbody = f.querySelector('[data-f="errors"]');
        r.errors.forEach((e) => {
          const row = clone('import-error-row-tpl');
          setF(row, 'row', e.row); setF(row, 'message', e.message);
          tbody.appendChild(row);
        });
      }
      box.appendChild(f);
      toast('Import hoàn tất', r.failed ? '' : 'ok');
    } catch (e) { box.innerHTML = ''; toast(e.message, 'err'); }
  });
}

// ===================== DANH SÁCH ĐIỂM =====================
async function vGrades(v) {
  await mount(v, 'grades');
  const m = await ensureMeta();
  fillOptions($('#gf-sem'), m.semesters, (s) => s.id, (s) => s.semester_name, '', 'Tất cả');
  fillOptions($('#gf-sub'), m.subjects, (s) => s.id, (s) => `${s.subject_code} - ${s.subject_name}`, '', 'Tất cả');
  const f = { q: '', semester_id: '', subject_id: '', result: '', page: 1 };

  async function load() {
    const box = $('#gres'); loading(box);
    const p = await api('/grades?' + qs(f));
    box.innerHTML = '';
    if (!p.data.length) { box.appendChild(clone('empty-tpl')); renderPager(box, null); return; }
    const table = clone('grades-table-tpl');
    const tbody = table.querySelector('[data-f="rows"]');
    p.data.forEach((g) => {
      const row = clone('grow-tpl');
      setF(row, 'student_code', g.student_code); setF(row, 'full_name', g.full_name);
      setF(row, 'subject', `${g.subject_code} - ${g.subject_name}`); setF(row, 'semester_name', g.semester_name);
      setF(row, 'teacher_name', g.teacher_name); setF(row, 'total_score', num(g.total_score)); setF(row, 'letter_grade', g.letter_grade);
      setBadge(row, 'result', g.result, RESULT);
      const editsCell = row.querySelector('[data-f="edits"]');
      if (g.edits) {
        const btn = clone('hist-btn-tpl').querySelector('button');
        btn.textContent = `${g.edits} lần`; btn.dataset.id = g.id;
        btn.addEventListener('click', () => showHistory(g.id));
        editsCell.appendChild(btn);
      } else editsCell.textContent = '—';
      tbody.appendChild(row);
    });
    box.appendChild(table);
    const pagerBox = document.createElement('div');
    box.appendChild(pagerBox);
    renderPager(pagerBox, p, (n) => { f.page = n; load(); });
  }

  async function showHistory(id) {
    try {
      const h = await api(`/grades/${id}/history`);
      const { box } = await openModal('grade-history');
      const tbody = box.querySelector('#hist-body');
      h.forEach((x) => {
        const row = clone('hist-row-tpl');
        setF(row, 'changed_at', x.changed_at); setF(row, 'old_score', num(x.old_score)); setF(row, 'new_score', num(x.new_score));
        setF(row, 'changed_by', x.changed_by || ''); setF(row, 'reason', x.reason);
        tbody.appendChild(row);
      });
      box.querySelector('#hist-close').addEventListener('click', () => box.closest('.modal-bg').remove());
    } catch (e) { toast(e.message, 'err'); }
  }

  $('#gf').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    ['q', 'semester_id', 'subject_id', 'result'].forEach((k) => { f[k] = d.get(k).trim(); });
    f.page = 1;
    load().catch((x) => toast(x.message, 'err'));
  });
  await load();
}

// ===================== THỐNG KÊ =====================
async function vStats(v) {
  await mount(v, 'stats');
  const [o, sem, sub, dist] = await Promise.all([api('/stats/overview'), api('/stats/by-semester'), api('/stats/by-subject'), api('/stats/distribution')]);
  $('#s-stat').append(
    statCard(o.pass_rate + '%', `Tỷ lệ đạt (${o.passed} điểm)`, 'ok'), statCard(o.fail_rate + '%', `Tỷ lệ rớt (${o.failed} điểm)`, 'bad'),
    statCard(num(o.avg_score), 'Điểm trung bình'), statCard(o.grades, 'Tổng bản ghi điểm', 'warn'),
  );
  sem.forEach((s) => $('#s-bar-sem').appendChild(barRow(s.semester_code, s.pass_rate, s.pass_rate + '%', 'ok')));
  const maxD = Math.max(...dist.map((d) => d.total), 1);
  dist.forEach((d) => $('#s-bar-dist').appendChild(barRow(d.letter_grade, d.total / maxD * 100, d.total)));
  const tbody = $('#s-subj-body');
  sub.forEach((s) => {
    const row = clone('subj-row-tpl');
    setF(row, 'subject_code', s.subject_code); setF(row, 'subject_name', s.subject_name); setF(row, 'total', s.total);
    setF(row, 'avg_score', num(s.avg_score)); setF(row, 'passed', s.passed); setF(row, 'rate', s.pass_rate + '%');
    row.querySelector('[data-f="bar"]').style.width = s.pass_rate + '%';
    tbody.appendChild(row);
  });
}

// ===================== QUẢN LÝ SINH VIÊN (Admin) =====================
async function vStudents(v) {
  await mount(v, 'students');
  const m = await ensureMeta();
  fillOptions($('#stf-class'), m.classes, (c) => c.id, (c) => c.class_code, '', 'Tất cả');
  fillOptions($('#stf-status'), Object.entries(STATUS).map(([k, t]) => ({ k, t })), (x) => x.k, (x) => x.t, '', 'Tất cả');
  const f = { q: '', class_id: '', status: '', page: 1 };
  let rows = [];

  async function load() {
    const box = $('#stres'); loading(box);
    const p = await api('/students?' + qs({ ...f, limit: 12 })); rows = p.data;
    box.innerHTML = '';
    if (!p.data.length) { box.appendChild(clone('empty-tpl')); renderPager(box, null); return; }
    const table = clone('students-table-tpl');
    const tbody = table.querySelector('[data-f="rows"]');
    p.data.forEach((s) => {
      const row = clone('strow-tpl');
      setF(row, 'student_code', s.student_code); setF(row, 'full_name', s.full_name); setF(row, 'dob', fmtDate(s.date_of_birth));
      setF(row, 'class_code', s.class_code); setF(row, 'email', s.email);
      setBadge(row, 'status', s.status, STATUS);
      row.querySelector('.ed').addEventListener('click', () => openForm(rows.find((r) => r.id === s.id)));
      row.querySelector('.dl').addEventListener('click', async () => {
        if (!confirm('Xóa sinh viên này?')) return;
        try { const r = await api('/students/' + s.id, { method: 'DELETE' }); toast(r.message, 'ok'); load(); } catch (e) { toast(e.message, 'err'); }
      });
      tbody.appendChild(row);
    });
    box.appendChild(table);
    const pagerBox = document.createElement('div');
    box.appendChild(pagerBox);
    renderPager(pagerBox, p, (n) => { f.page = n; load(); });
  }

  async function openForm(s) {
    const edit = !!s;
    s = s || { gender: 'MALE', status: 'ACTIVE', admission_year: new Date().getFullYear() };
    const { box } = await openModal('student-form');
    box.querySelector('#sfm-title').textContent = edit ? 'Sửa sinh viên' : 'Thêm sinh viên';
    const form = box.querySelector('#sform');
    form.student_code.value = s.student_code || ''; if (edit) form.student_code.disabled = true; else form.student_code.required = true;
    form.full_name.value = s.full_name || '';
    form.date_of_birth.value = s.date_of_birth || '';
    fillOptions(form.gender, Object.entries(GENDER).map(([k, t]) => ({ k, t })), (x) => x.k, (x) => x.t, s.gender);
    fillOptions(form.class_id, m.classes, (c) => c.id, (c) => c.class_code, s.class_id);
    form.admission_year.value = s.admission_year || '';
    form.email.value = s.email || ''; form.phone.value = s.phone || ''; form.address.value = s.address || '';
    fillOptions(form.status, Object.entries(STATUS).map(([k, t]) => ({ k, t })), (x) => x.k, (x) => x.t, s.status);
    if (!edit) box.querySelector('#sfm-hint').style.display = '';
    box.querySelector('#cx').addEventListener('click', () => box.closest('.modal-bg').remove());
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        const r = edit ? await api('/students/' + s.id, { method: 'PUT', body }) : await api('/students', { method: 'POST', body });
        toast(r.message, 'ok'); box.closest('.modal-bg').remove(); load();
      } catch (err) { toast(err.message, 'err'); }
    });
  }

  $('#addst').addEventListener('click', () => openForm());
  $('#stf').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    ['q', 'class_id', 'status'].forEach((k) => { f[k] = d.get(k).trim(); });
    f.page = 1;
    load().catch((x) => toast(x.message, 'err'));
  });
  await load();
}

// ===================== QUẢN LÝ TÀI KHOẢN (Admin) =====================
async function vUsers(v) {
  await mount(v, 'users');
  fillOptions($('#uf-role'), Object.entries(ROLE).map(([k, t]) => ({ k, t })), (x) => x.k, (x) => x.t, '', 'Tất cả');
  const f = { q: '', role: '', page: 1 };

  async function load() {
    const box = $('#ures'); loading(box);
    const p = await api('/admin/users?' + qs(f));
    box.innerHTML = '';
    const table = clone('users-table-tpl');
    const tbody = table.querySelector('[data-f="rows"]');
    p.data.forEach((u) => {
      const row = clone('urow-tpl');
      setF(row, 'username', u.username); setF(row, 'full_name', u.full_name);
      setBadge(row, 'role', u.role, ROLE);
      setBadge(row, 'active', u.is_active ? 'on' : 'off', { on: 'Hoạt động', off: 'Đã khóa' });
      const tg = row.querySelector('.tg');
      tg.textContent = u.is_active ? 'Khóa' : 'Mở khóa';
      tg.addEventListener('click', async () => {
        try { const r = await api(`/admin/users/${u.id}/active`, { method: 'PATCH', body: { is_active: !u.is_active } }); toast(r.message, 'ok'); load(); } catch (e) { toast(e.message, 'err'); }
      });
      row.querySelector('.rs').addEventListener('click', async () => {
        if (!confirm('Đặt lại mật khẩu về mặc định?')) return;
        try { const r = await api(`/admin/users/${u.id}/reset-password`, { method: 'POST' }); toast(r.message, 'ok'); } catch (e) { toast(e.message, 'err'); }
      });
      tbody.appendChild(row);
    });
    box.appendChild(table);
    const pagerBox = document.createElement('div');
    box.appendChild(pagerBox);
    renderPager(pagerBox, p, (n) => { f.page = n; load(); });
  }

  $('#uf').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    f.q = d.get('q').trim(); f.role = d.get('role'); f.page = 1;
    load().catch((x) => toast(x.message, 'err'));
  });
  await load();
}

// ===================== ĐỔI MẬT KHẨU =====================
async function vPassword(v) {
  await mount(v, 'password');
  $('#pf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (d.new_password !== d.confirm) return toast('Mật khẩu nhập lại không khớp', 'err');
    try { const r = await api('/auth/change-password', { method: 'POST', body: d }); toast(r.message, 'ok'); e.target.reset(); }
    catch (err) { toast(err.message, 'err'); }
  });
}

const VIEWS = {
  dashboard: vDashboard, my: vMy, lookup: vLookup, student: vStudent, entry: vEntry,
  import: vImport, grades: vGrades, stats: vStats, students: vStudents, users: vUsers, password: vPassword,
};

// ===================== KHỞI ĐỘNG =====================
(async function init() {
  // nạp các template dùng chung (stat, bar, pager...) vào #templates
  const commonHtml = await loadPageHTML('common');
  $('#templates').innerHTML = commonHtml;
  if (token) {
    try { user = { ...user, ...(await api('/auth/me')) }; localStorage.setItem('user', JSON.stringify(user)); }
    catch { logout(false); }
  }
  render();
})();
