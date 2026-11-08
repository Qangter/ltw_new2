# Nội dung slide 12–22 — Website tra cứu kết quả thi trực tuyến

Ngày đối chiếu: **08/11/2026**. Căn cứ: mã nguồn trong working tree, lịch sử Git của các nhánh dự án và nhật ký migration cập nhật ngày 06/11/2026.

Mỗi slide gồm nội dung ngắn để đưa lên slide, phần giải thích/đoạn mã cho ghi chú thuyết trình và liên kết nguồn. Các đoạn rút gọn được ghi rõ; không chạy SQL hoặc sửa dữ liệu khi biên soạn tài liệu này.

**Phạm vi frontend:** React trong [fe-react](../fe-react/). Toàn bộ ví dụ frontend, màn hình, API client và kiểm thử trong bộ slide lấy từ mã React. Xem phần trước tại [slide 2–11](./noi-dung-slide-2-11.md).

**Quy ước bằng chứng:** “Đã code/gọi API” không đồng nghĩa “đã nghiệm thu mọi thao tác với DB thật”. Số liệu kiểm thử bên dưới được dẫn từ nhật ký, không phải kết quả chạy mới ngày 08/11. Working tree đang có nhiều thay đổi chưa commit, nên lịch sử nhánh chưa phản ánh đầy đủ bản hiện tại.

## Slide 12 — Tiến độ phát triển

### Nội dung đưa lên slide

| Thời gian | Giai đoạn / kết quả có bằng chứng |
|---|---|
| 30/09/2026 | Mốc commit đầu tiên đang có trong lịch sử nhánh: `68fa6b7` — “Update project”. |
| 02/10/2026 | Tổ chức backend theo Route–Controller–Model, commit `1e0e1fe` — “MVC”. |
| 09/10/2026 | Hai đợt chỉnh giao diện và cập nhật logo: `f38bde7`, `1314a88`, `6010806`. |
| 12/10/2026 | Bổ sung tài liệu: `2b6e5ca` — “them doc”. |
| 03–04/11/2026 | Theo nhật ký: khảo sát hợp đồng API, dựng React/component, triển khai xác thực và phân quyền. Commit `4a51c9f` ngày 04/11 bổ sung nền tảng React và tài liệu. |
| 05/11/2026 | Hoàn thiện các trang đọc, đối chiếu API thật; triển khai quản trị sinh viên/tài khoản. |
| 06/11/2026 | Triển khai nhập điểm, import Excel; cấu hình build React qua Express, kiểm tra production và rollback. |

**Trạng thái hiện tại:** Đã có code các chức năng chính; các thao tác ghi DB thật và vấn đề quyền import B02 vẫn chưa được nghiệm thu đầy đủ.

### Ghi chú thuyết trình

- Ngày 30/09 là commit đầu tiên quan sát được, không đủ chứng minh đó là ngày bắt đầu làm đồ án.
- Commit MVC có thay đổi thực tế ở controller/model và thu gọn các route, không chỉ đổi tên commit.
- Các mốc 03–06/11 dựa trên nhật ký phát triển; không gán tất cả cho ngày commit 04/11.
- Không đếm các commit “Agent host session…/checkpoint” ở refs phụ như những lần hoàn thành tính năng hoặc hoạt động của thành viên nhóm.
- Chưa có bằng chứng để kết luận đã deploy công khai hoặc hoàn tất nghiệm thu toàn bộ hệ thống.

**Nguồn:** `git log --date=short`, `git show --stat 1e0e1fe`, `git show --stat 4a51c9f`; [nhật ký migration](./react-migration-progress.md), [README React](../fe-react/README.md).

## Slide 13 — Git và môi trường

### Nội dung đưa lên slide

- **main:** Nhánh chính hiện trỏ tới `2b6e5ca` ngày 12/10; remote tương ứng là `origin/main`.
- **frontend-react:** Nhánh đang làm việc, dành cho chuyển đổi frontend; HEAD và `origin/frontend-react` cùng trỏ tới `4a51c9f` ngày 04/11 tại thời điểm kiểm tra.
- So với main, nhánh frontend-react có thêm **1 commit** trong lịch sử nhánh; nhiều phần phát triển tiếp theo còn ở working tree.
- **Chưa thấy nhánh dev hoặc nhánh dạng feature/** trong danh sách nhánh hiện có; chưa có bằng chứng nhóm áp dụng đầy đủ Git Flow hay quy trình PR/review.

### Cách diễn đạt về quy trình nhánh

“Nhóm giữ mã nguồn chính trên main và tách công việc chuyển frontend sang nhánh frontend-react. Các thay đổi được kiểm tra trước khi đưa về nhánh chính.”

Vế “kiểm tra trước khi đưa về nhánh chính” là định hướng quy trình, không phải bằng chứng đã merge. Lệnh kiểm tra merge hiện không cho thấy merge commit trên hai nhánh; điều này cũng không loại trừ khả năng từng fast-forward hoặc squash. Không trình bày `feature → dev → main` là lịch sử đã xảy ra; nếu muốn dùng mô hình đó, ghi rõ **quy trình đề xuất**.

### Các biến môi trường

| Biến | Chức năng | Giá trị không bí mật / cách dùng |
|---|---|---|
| `PORT` | Cổng HTTP của Express | Mẫu: `3000`. |
| `FRONTEND` | Chọn frontend Express phục vụ | Đặt `react` để phục vụ bản build React; hướng dẫn trình bày dùng `start:react` để chọn rõ mode. |
| `DB_HOST` | Địa chỉ máy chủ MySQL | Mẫu: `localhost`. |
| `DB_PORT` | Cổng MySQL | Mẫu: `3306`. |
| `DB_USER` | Tài khoản kết nối MySQL | Mẫu dùng `root`; quyền thực tế phụ thuộc cấu hình DB. |
| `DB_PASSWORD` | Mật khẩu tài khoản MySQL | Cấu hình riêng cho môi trường; không chép giá trị mật khẩu vào slide. |
| `DB_NAME` | Tên database | `diem_thi`. |
| `JWT_SECRET` | Khóa bí mật để ký và xác minh JWT | Thay chuỗi mẫu bằng giá trị riêng; không đưa vào frontend. |
| `API_PROXY_TARGET` | Đích proxy API của Vite dev/preview | Trong mẫu frontend: `http://localhost:3000`; chỉ dùng phía Vite, không đưa vào bundle trình duyệt. |

Backend dùng dotenv để nạp cấu hình; mysql2 đọc nhóm biến DB; middleware JWT đọc JWT_SECRET. Biến FRONTEND của shell ưu tiên file cấu hình, còn script start chọn mode rõ ràng có mức ưu tiên cao hơn. Không dùng biến `VITE_*` để chứa bí mật DB/JWT.

**Nguồn:** `git branch -a`, `git rev-list --left-right --count main...frontend-react`, `git log --merges main frontend-react`; [mẫu môi trường backend](../be/.env.example), [mẫu môi trường frontend](../fe-react/.env.example), [MySQL pool](../be/config/db.js), [Vite config](../fe-react/vite.config.js), [README](../README.md).

## Slide 14 — Design System

### Nội dung đưa lên slide

- Điểm nạp CSS của ứng dụng React là [index.css](../fe-react/src/styles/index.css), gồm stylesheet được import và các quy tắc riêng cho component React.
- Màu chủ đạo xanh dương, nền xám sáng, font **Inter**.
- Tái sử dụng thẻ nội dung, bảng, nhãn trạng thái, phân trang, modal và các trạng thái tải/rỗng/lỗi.

### Các token màu được giao diện React sử dụng

Các token dưới đây được stylesheet React nạp qua `@import`; chúng không được khai báo trực tiếp lại trong file index.css. Phần trình bày mô tả giao diện React đang dùng các token đó, không coi chúng là biến mới do React tự sinh.

| Biến | Giá trị | Ý nghĩa |
|---|---|---|
| `--primary` | `#3b82f6` | Màu chủ đạo |
| `--primary-d` | `#2563eb` | Màu chủ đạo đậm / hover |
| `--primary-light` | `#dbeafe` | Nền xanh nhạt |
| `--bg` | `#f1f5f9` | Nền trang |
| `--card` | `#ffffff` | Nền thẻ |
| `--text` | `#0f172a` | Chữ chính |
| `--muted` | `#64748b` | Chữ phụ |
| `--line` | `#e2e8f0` | Đường viền |
| `--ok` / `--ok-light` | `#10b981` / `#d1fae5` | Thành công và nền nhạt |
| `--bad` / `--bad-light` | `#ef4444` / `#fee2e2` | Lỗi và nền nhạt |
| `--warn` / `--warn-light` | `#f59e0b` / `#fef3c7` | Cảnh báo và nền nhạt |

Ngoài màu có các token bo góc `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl` lần lượt 6/8/12/16px; nhóm bóng đổ và chuyển động dùng chung, thời lượng `--duration: 200ms`.

### Component được tái sử dụng nhiều

Số đếm là số dòng import trực tiếp trong các file JSX thuộc features, loại test và trang preview; không phải số lần render hoặc thống kê toàn ứng dụng.

| Component | Số file import | Vai trò |
|---|---:|---|
| EmptyState | 13 | Hiển thị khi chưa có dữ liệu |
| QueryState | 11 | Thống nhất tải lần đầu, refetch, lỗi và thử lại |
| DataTable | 9 | Khung bảng dữ liệu |
| Card | 8 | Khối nội dung dùng chung |
| Badge | 8 | Hiển thị trạng thái bằng màu và chữ |
| MetadataSelect | 4 | Chọn danh mục như lớp/học kỳ |
| Pagination | 4 | Điều hướng danh sách phân trang |
| ConfirmDialog | 4 | Xác nhận thao tác |
| Modal | 3 | Hộp thoại dùng chung |

React tái sử dụng các component qua props và JSX; layout, trạng thái dữ liệu và hộp thoại được tách thành component riêng. Các class `.card`, `.stat`, `.badge`, `.pager` và `.react-modal` phục vụ định dạng component, không phải cơ chế nạp template HTML cho từng màn hình.

**Nguồn:** [stylesheet đầu vào React](../fe-react/src/styles/index.css), [component React](../fe-react/src/components/), [bàn kiểm tra component](../fe-react/src/features/preview/ComponentPreviewPage.jsx).

## Slide 15 — Frontend tương tác

### Nội dung đưa lên slide

- Component React gọi service/query hook; API client dùng Fetch API gửi request bất đồng bộ, kèm Bearer token.
- JSON dùng cho dữ liệu form; FormData dùng cho upload file.
- Frontend kiểm tra dữ liệu, khóa gửi lặp và hiển thị lỗi; backend kiểm tra lại trước khi ghi DB.

### Đoạn JS thực tế — 7 dòng

Trích nguyên 7 dòng liên tiếp trong [API client React](../fe-react/src/services/apiClient.js), chỉ bỏ mức thụt lề chung; đây là phần thân hàm, đã có biến headers/token/body/controller trong phạm vi bên ngoài:

```javascript
if (token) headers.set('Authorization', `Bearer ${token}`)
if (body instanceof FormData) headers.delete('Content-Type')
else if (body !== undefined) {
  headers.set('Content-Type', 'application/json')
  body = JSON.stringify(body)
}
const response = await fetchImpl(`${url.pathname}${url.search}`, { method, headers, body, signal: controller.signal })
```

`fetchImpl` mặc định là `globalThis.fetch`, không phải hàm mock trong ứng dụng. Client có AbortSignal, tách phiên người dùng, xử lý HTTP status, JSON/blob và lỗi mạng. Import FormData không tự đặt Content-Type để trình duyệt tạo multipart boundary. Form đăng nhập sử dụng React Hook Form; lỗi API được chuyển vào lỗi form bằng setError.

### Dữ liệu mock/giả nằm ở đâu?

| Vị trí | Dữ liệu / mục đích | Có dùng làm dữ liệu nghiệp vụ production? |
|---|---|---|
| [readFixtures.js](../fe-react/src/test/readFixtures.js) | Sinh viên, bảng điểm, GPA, thống kê và lịch sử mẫu cho test | Không; file ghi rõ test-only |
| [authFixtures.js](../fe-react/src/test/authFixtures.js) | User/token/storage/fetch giả phục vụ unit/component test | Không |
| [read-fixtures.js](../fe-react/e2e/read-fixtures.js) và các browser tests | Intercept HTTP bằng `route.fulfill` để mô phỏng phản hồi | Chỉ khi chạy test tương ứng |
| [ComponentPreviewPage.jsx](../fe-react/src/features/preview/ComponentPreviewPage.jsx) | Danh mục component tĩnh, nút thử toast/modal, ví dụ lỗi/rỗng | Chỉ route dev `#/__components`; không phải bảng điểm giả |
| [FeaturePlaceholder.jsx](../fe-react/src/components/feedback/FeaturePlaceholder.jsx) | Component placeholder còn trong source | Không được các trang nghiệp vụ hiện tại import theo lần quét này |

**Kết luận có căn cứ:** Không thấy trang nghiệp vụ hiện tại lấy dữ liệu học vụ từ fixture hoặc mảng điểm hard-code để thay API. Các trang quản trị/nhập điểm/import đã gọi API thật trong code, nhưng nhiều ca kiểm thử ghi vẫn dùng mock. Dữ liệu seed trong MySQL là dữ liệu mô phỏng qua backend thật, khác với mock response frontend.

**Giải thích file được chỉ định:** [authFixtures.js](../fe-react/src/test/authFixtures.js) import `vi` từ Vitest, dựng storage bằng `vi.fn()` và truyền fetchMock vào createAuthSession để kiểm thử. Mã chạy ứng dụng dùng [AuthProvider](../fe-react/src/features/auth/AuthProvider.jsx) và [authSession](../fe-react/src/features/auth/authSession.js) với fetch mặc định. Không dùng authFixtures làm ví dụ kết nối API production.

**Nguồn bổ sung:** [router hiện tại](../fe-react/src/app/AppRoutes.jsx), [README React](../fe-react/README.md), [ma trận nghiệm thu](./react-migration-progress.md).

## Slide 16 — Backend Route: lấy bảng điểm cá nhân

### Nội dung đưa lên slide

**Endpoint:** `GET /api/students/me/transcript?semester_id=...`

**Luồng:** Express mount → Route → auth → requireRole(STUDENT) → myTranscript → studentModel → MySQL → JSON.

- JWT xác định tài khoản; chỉ role STUDENT dùng endpoint này.
- ID sinh viên được tìm từ `req.user.id`, không nhận ID người khác từ client.
- Model lấy hồ sơ, JOIN điểm/môn/học kỳ và tính summary/GPA.
- Response gồm `student`, `grades`, `summary`; thiếu hồ sơ trả 404.

### Mã nguồn rút gọn theo từng tầng

Mount trong [server.js](../be/server.js):

```javascript
app.use('/api/students', require('./routes/students'));
```

Route trong [students.js](../be/routes/students.js):

```javascript
router.get('/me/transcript', auth, requireRole('STUDENT'), wrap(studentsController.myTranscript));
```

Controller thực tế trong [studentsController.js](../be/controllers/studentsController.js):

```javascript
async function myTranscript(req, res) {
  const id = await studentModel.findIdByUserId(req.user.id);
  if (!id) throw new HttpError(404, 'Không tìm thấy hồ sơ sinh viên');
  res.json({ student: await studentModel.findById(id), ...(await studentModel.getTranscript(id, req.query.semester_id)) });
}
```

Model ánh xạ tài khoản sang sinh viên trong [studentModel.js](../be/models/studentModel.js):

```javascript
async function findIdByUserId(userId) {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows[0] && rows[0].id;
}
```

`getTranscript` thực hiện truy vấn JOIN và tính GPA; xem slide 20. `wrap` chuyển lỗi Promise sang error handler; auth trả 401 khi token thiếu/sai/hết hạn, requireRole trả 403 khi sai vai trò.

**Nguồn bổ sung:** [middleware xác thực](../be/middleware/auth.js), [MySQL pool](../be/config/db.js).

## Slide 17 — Database CRUD và truy vấn JOIN

### Nội dung đưa lên slide

- Bảng `grades` lưu điểm cho từng lượt đăng ký học phần.
- `id` là PK; `enrollment_id` là FK và UNIQUE: mỗi đăng ký tối đa một bản ghi điểm.
- CHECK ràng buộc điểm 0–10; `updated_by` liên kết người sửa trong users.
- Truy vấn JOIN kết nối khoa–ngành–lớp–sinh viên để phục vụ thống kê.

### SQL tạo bảng grades — nguyên định nghĩa trong schema

Đoạn này dành cho ghi chú/slide phụ; trên slide chính chỉ chọn các dòng PK, UNIQUE, CHECK và FK để dễ đọc.

```sql
CREATE TABLE grades (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id        INT UNSIGNED NOT NULL,
    attendance_score     DECIMAL(4,2) NULL COMMENT 'Điểm chuyên cần 0-10',
    midterm_score        DECIMAL(4,2) NULL COMMENT 'Điểm giữa kỳ 0-10',
    final_score          DECIMAL(4,2) NOT NULL COMMENT 'Điểm cuối kỳ 0-10',
    total_score          DECIMAL(4,2) NOT NULL COMMENT 'Điểm tổng kết = 0.1*CC + 0.3*GK + 0.6*CK, 0-10',
    letter_grade         ENUM('A+','A','B+','B','C+','C','D','F') NOT NULL,
    result               ENUM('PASSED','FAILED') NOT NULL,
    updated_by           INT UNSIGNED NULL COMMENT 'user (giáo viên/admin) nhập/sửa điểm gần nhất',
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_grades_enrollment UNIQUE (enrollment_id),
    CONSTRAINT chk_grades_attendance CHECK (attendance_score IS NULL OR (attendance_score BETWEEN 0 AND 10)),
    CONSTRAINT chk_grades_midterm CHECK (midterm_score IS NULL OR (midterm_score BETWEEN 0 AND 10)),
    CONSTRAINT chk_grades_final CHECK (final_score BETWEEN 0 AND 10),
    CONSTRAINT chk_grades_total CHECK (total_score BETWEEN 0 AND 10),
    CONSTRAINT fk_grades_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_grades_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Điểm của sinh viên cho một lượt đăng ký (enrollment). Không lưu tên SV/môn/học kỳ trực tiếp.';
```

**Lưu ý:** `total_score` là cột lưu giá trị do backend tính, không phải generated column SQL. Chú thích công thức trong DDL không tự thực thi phép tính.

### Truy vấn SELECT có JOIN thực tế

Trích SQL của `getByDepartment` trong [statsModel.js](../be/models/statsModel.js), chỉ căn lại xuống dòng:

```sql
SELECT d.department_name, COUNT(s.id) AS students
FROM departments d
LEFT JOIN majors m ON m.department_id=d.id
LEFT JOIN classes c ON c.major_id=m.id
LEFT JOIN students s ON s.class_id=c.id
GROUP BY d.id
ORDER BY students DESC
```

LEFT JOIN giữ cả khoa chưa có sinh viên; COUNT(s.id) trả 0 cho trường hợp đó. GROUP BY tổng hợp theo khoa, ORDER BY sắp số sinh viên giảm dần.

### Liên hệ CRUD của điểm

| Thao tác | Nơi thực hiện |
|---|---|
| Create | `saveGrade`: INSERT khi enrollment chưa có điểm |
| Read | Model lấy danh sách điểm hoặc JOIN bảng điểm sinh viên |
| Update | `saveGrade`: UPDATE bản ghi hiện có và ghi lịch sử nếu tổng điểm đổi |
| Delete | `gradeModel.deleteGrade`: DELETE theo grade ID sau kiểm tra quyền |

**Nguồn:** [schema](../database/02_schema.sql), [model thống kê](../be/models/statsModel.js), [model điểm](../be/models/gradeModel.js), [service lưu điểm](../be/services/gradeService.js), [controller điểm](../be/controllers/gradesController.js).

## Slide 18 — Xác thực bằng bcrypt và JWT

### Nội dung đưa lên slide

1. **Lưu mật khẩu:** bcrypt băm một chiều với cost 10; DB lưu password_hash.
2. **Đăng nhập:** Tìm tài khoản, dùng bcrypt.compare đối chiếu mật khẩu và kiểm tra trạng thái hoạt động.
3. **Cấp token:** JWT chứa id, role, username; ký bằng JWT_SECRET, hết hạn sau 8 giờ.
4. **Gửi request:** Frontend gửi `Authorization: Bearer <token>`.
5. **Xác thực và phân quyền:** Middleware xác minh token, gắn req.user; requireRole kiểm tra quyền trước controller.

### Mã nguồn tiêu biểu

```javascript
await userModel.updatePassword(req.user.id, await bcrypt.hash(String(new_password), 10));
```

```javascript
const sign = (u) => jwt.sign({ id: u.id, role: u.role, username: u.username }, SECRET, { expiresIn: '8h' });
```

Middleware thực tế tên là `auth`, không có hàm riêng tên verifyToken:

```javascript
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }); }
}
```

### Ghi chú thuyết trình

- bcrypt là **băm mật khẩu**, không phải mã hóa có thể giải mã; không có bước giải mã mật khẩu khi login.
- JWT được ký để kiểm tra tính toàn vẹn; chữ ký không che nội dung payload. Không đưa mật khẩu vào token.
- 401: thiếu/sai/hết hạn token. 403: role không được phép.
- Role trong JWT chưa đủ quyết định quyền lớp: controller nhập điểm kiểm tra thêm giảng viên có phụ trách lớp hay không.
- Backend hiện chưa thu hồi JWT cũ ngay khi khóa tài khoản/reset mật khẩu; middleware không tra lại is_active mỗi request. Không tuyên bố có thu hồi phiên tức thời.

**Nguồn:** [authController.js](../be/controllers/authController.js), [middleware auth.js](../be/middleware/auth.js), [studentsController.js](../be/controllers/studentsController.js), [phiên đăng nhập React](../fe-react/src/features/auth/authSession.js).

## Slide 19 — Luồng nhập điểm của giảng viên

### Nội dung đưa lên slide

**Chọn học kỳ/lớp → tải sinh viên → nhập điểm → kiểm tra dữ liệu → PUT API → transaction lưu điểm → cập nhật kết quả.**

- Chuyên cần và giữa kỳ được để trống; cuối kỳ bắt buộc.
- Điểm phải là số trong khoảng **0–10**, chấp nhận dấu phẩy thập phân.
- Frontend giữ bản nháp theo enrollment_id; hỗ trợ lưu từng dòng hoặc tất cả dòng đã sửa.
- Backend kiểm tra quyền lớp, tính điểm và xếp loại; thành công trả ID điểm và kết quả chính thức.
- Lỗi giữ bản nháp và thông báo ở dòng; không tự gửi lại thao tác ghi.

### Luồng chi tiết

1. `GradeEntryPage` tải metadata/học kỳ, sau đó GET `/api/offerings?semester_id=...`; model giới hạn danh sách lớp của TEACHER theo tài khoản.
2. Chọn lớp, GET `/api/offerings/:id/students`; controller xác minh quyền trước khi trả danh sách.
3. `GradeEntryRow` nhận CC/GK/CK; `validateScores` kiểm tra trước khi gửi. Không tính GPA hay kết quả tổng kết ở client.
4. `saveGrade` frontend gửi PUT `/api/grades/enrollment/:enrollmentId` với điểm và lý do cập nhật.
5. `updateGrade` tìm enrollment, gọi `assertOfferingAccess`, rồi `parseScore` cho từng thành phần.
6. Mở transaction; service dùng SELECT ... FOR UPDATE, INSERT hoặc UPDATE, ghi grade_history nếu tổng điểm cũ khác mới; commit hoặc rollback, luôn release connection.
7. API trả `{ id, total, letter, result, created }`; frontend cập nhật grade_id ngay và làm mới cache bảng điểm/thống kê/lịch sử.

### Kiểm tra điểm thực tế ở backend

```javascript
function parseScore(v, name, required) {
  if (v === undefined || v === null || String(v).trim() === '') {
    if (required) throw new HttpError(400, `Thiếu ${name}`);
    return null;
  }
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 10) throw new HttpError(400, `${name} phải là số từ 0 đến 10`);
  return Math.round(n * 100) / 100;
}
```

Kiểm tra khoảng trước khi làm tròn; tối đa hai chữ số thập phân sau chuẩn hóa. Đủ ba thành phần: **10% CC + 30% GK + 60% CK**; thiếu CC hoặc GK thì dùng CK làm tổng kết. Tổng kết từ 5 được xếp đạt.

### Câu UPDATE thực tế

```javascript
await conn.query(
  `UPDATE grades SET attendance_score=?, midterm_score=?, final_score=?, total_score=?, letter_grade=?, result=?, updated_by=? WHERE id=?`,
  [attendance, midterm, final, total, letter, result, userId, g.id]);
```

**Lưu tất cả** gửi lần lượt từng dòng dirty; mỗi request có transaction riêng. Một dòng lỗi không rollback những dòng đã lưu thành công. Khi đổi lớp/trang có guard bảo vệ bản nháp. UI không được coi thao tác hủy request là bằng chứng server đã rollback.

**Nguồn:** [GradeEntryPage](../fe-react/src/features/grade-entry/GradeEntryPage.jsx), [OfferingEditor](../fe-react/src/features/grade-entry/OfferingEditor.jsx), [GradeEntryRow](../fe-react/src/features/grade-entry/GradeEntryRow.jsx), [validation frontend](../fe-react/src/features/grade-entry/gradeDraft.js), [API nhập điểm](../fe-react/src/features/grade-entry/entryService.js), [quản lý draft](../fe-react/src/features/grade-entry/useGradeDrafts.js), [controller](../be/controllers/gradesController.js), [utility điểm](../be/utils/grade.js), [service lưu điểm](../be/services/gradeService.js).

## Slide 20 — Tra cứu và tính GPA

### Nội dung đưa lên slide

- Sinh viên xem bảng điểm bản thân; Admin/Giảng viên tra cứu theo sinh viên.
- GPA hiện tại là **điểm trung bình thang 10 có trọng số tín chỉ**.
- Backend tính GPA trên các dòng điểm trả về, theo học kỳ đang lọc hoặc tất cả học kỳ.
- Frontend nhận `grades` và `summary` từ API, chỉ định dạng để hiển thị.

### Đoạn tính GPA nguyên bản

Trong `getTranscript` của [studentModel.js](../be/models/studentModel.js), sau truy vấn JOIN:

```javascript
let credits = 0, weighted = 0, passedCredits = 0, failed = 0;
for (const grade of grades) {
  credits += grade.credits; weighted += grade.total_score * grade.credits;
  if (grade.result === 'PASSED') passedCredits += grade.credits; else failed++;
}
const summary = { subjects: grades.length, credits, passed_credits: passedCredits, failed_subjects: failed,
  gpa: credits ? Math.round(weighted / credits * 100) / 100 : null };
return { grades, summary };
```

**Công thức:** GPA = Σ(điểm tổng kết × số tín chỉ) / Σ(số tín chỉ), làm tròn hai chữ số thập phân. Không có tín chỉ trả null; môn chưa có bản ghi điểm không được JOIN vào kết quả. Môn không đạt vẫn tham gia GPA nếu đã có điểm; chỉ passed_credits loại tín chỉ không đạt.

Code chưa quy đổi GPA thang 4 hoặc chọn lần học lại tốt nhất; không mô tả các quy tắc này là đã có.

### Luồng hiển thị bảng điểm và Dashboard

**Bảng điểm sinh viên:** `#/my` → transcript service → GET `/api/students/me/transcript` → controller/model → `{ student, grades, summary }` → `TranscriptView` hiển thị GPA, tín chỉ, số môn và bảng theo học kỳ. Staff dùng `#/student/:id` với API `/api/students/:id/transcript`.

**Dashboard dành cho Admin/Giảng viên:** `DashboardPage` gọi bốn truy vấn độc lập qua `useStatsQuery`:

| API | Hiển thị |
|---|---|
| `/api/stats/overview` | Thẻ tổng quan, điểm trung bình và tỷ lệ đạt/rớt |
| `/api/stats/by-semester` | Tỷ lệ đạt theo học kỳ |
| `/api/stats/distribution` | Phân bố điểm chữ |
| `/api/stats/by-department` | Số sinh viên theo khoa |

Route thống kê → statsController → statsModel → MySQL → query cache → StatCards/biểu đồ. Mỗi phần có trạng thái tải/rỗng/lỗi riêng.

**Phân biệt khi thuyết trình:** `avg_score` trên Dashboard lấy `ROUND(AVG(total_score),2)` của toàn bộ bản ghi điểm, không có trọng số tín chỉ; đó **không phải GPA cá nhân**. Student được điều hướng tới bảng điểm bản thân, không có Dashboard thống kê toàn hệ thống.

**Nguồn:** [model bảng điểm](../be/models/studentModel.js), [service bảng điểm](../fe-react/src/features/transcripts/transcriptService.js), [TranscriptView](../fe-react/src/features/transcripts/TranscriptView.jsx), [DashboardPage](../fe-react/src/features/dashboard/DashboardPage.jsx), [hook thống kê](../fe-react/src/features/statistics/hooks/useStatsQuery.js), [service thống kê](../fe-react/src/features/statistics/services/statsService.js), [statsModel](../be/models/statsModel.js), [route thống kê](../be/routes/stats.js).

## Slide 21 — Tích hợp Frontend và Backend

### Nội dung đưa lên slide

- Giao tiếp HTTP/JSON qua `/api`; file import dùng multipart/FormData.
- Development: Vite proxy `/api` sang Express theo API_PROXY_TARGET.
- Production: Express phục vụ React build và API cùng origin.
- Xác thực bằng Bearer JWT; không dùng phiên đăng nhập dựa trên cookie.
- Các trang đọc đã có đối chiếu API thật; các luồng ghi cần hoàn tất nghiệm thu DB thật.

### CORS và fetch credentials thực tế

Backend có:

```javascript
app.use(cors());
app.use(express.json({ limit: '1mb' }));
```

Không truyền allowlist origin hoặc `credentials: true` vào cors. Các hàm fetch hiện không đặt `credentials: 'include'`; dùng chế độ mặc định của fetch. Token được gắn rõ trong Authorization, không dựa vào cookie xuyên origin. Vì vậy không ghi “đã bật fetch credentials/include” hoặc “CORS chỉ cho phép frontend xác định”.

Proxy Vite giữ nguyên đường dẫn `/api` và dùng `changeOrigin: true`. Khi chạy production, không cần Vite để ứng dụng gọi API. FormData không tự đặt Content-Type; JSON có Content-Type application/json. API client React xử lý 401 để kết thúc phiên, còn 403 hiển thị lỗi quyền và giữ phiên.

### Màn hình nào đã tích hợp hoàn chỉnh 100%?

**Chưa có căn cứ để khẳng định 100% theo mọi trường hợp.** Phân biệt mức đã nối API, đã kiểm tra thật và còn thiếu nghiệm thu:

| Nhóm màn hình/chức năng | Code API | Bằng chứng kiểm tra thật được ghi nhận | Giới hạn |
|---|---|---|---|
| Đăng nhập, xác minh phiên, guard | Có | Login 3 role, `/me`, reload, token sai và GET ngoài quyền | Khóa/reset không thu hồi ngay JWT; đổi mật khẩu thành công chưa nghiệm thu ghi thật |
| Dashboard, thống kê | Có | Đối chiếu số liệu giao diện React với API bằng Admin/Giảng viên | Không suy ra kiểm thử tải hoặc mọi browser |
| Tra cứu, bảng điểm cá nhân/chi tiết | Có | Đối chiếu dữ liệu, học kỳ, summary/GPA và phân trang | Quy tắc học lại/GPA thang 4 chưa có |
| Danh sách điểm, lịch sử | Có | Đối chiếu danh sách và lịch sử đang có trong DB | Lịch sử mới phát sinh sau sửa điểm thật còn cần kiểm tra |
| Quản lý sinh viên, tài khoản | Có | Có kiểm tra đọc danh sách; CRUD/khóa/reset chủ yếu fixture | Chưa nghiệm thu đầy đủ thao tác ghi trên dữ liệu thử riêng |
| Nhập điểm | Có | Đọc lớp/SV, so dữ liệu API; GET lớp ngoài quyền trả 403 | Lưu/xóa/enroll thật chưa nghiệm thu đầy đủ |
| Import Excel | Có | Tải XLSX mẫu thật, xác minh nội dung và quyền tải | Upload/partial import/ghi DB thật chưa nghiệm thu; B02 còn mở |
| Build React qua Express | Có | Nhật ký ghi kiểm tra HTTP, asset và route hash trên build React thật | Chưa triển khai ngoài máy local |

Theo nhật ký ngày 06/11: **143 component tests đạt**; **47 production E2E đạt, 1 test ghi thật bị skip**; 6 test nền tảng dev đạt riêng. Trong 47 production có **33 fixture + 13 live auth/đọc/tải mẫu + 1 HTTP production**. Không gọi toàn bộ 47 ca là tích hợp DB thật; không cộng các lượt chạy lặp thành số test độc lập.

B02: TEACHER thiếu hồ sơ teachers có thể khiến bộ lọc teacherId của import không được áp dụng; đây là phát hiện chưa sửa, không phải thành tích khắc phục.

**Nguồn:** [Express server](../be/server.js), [Vite config](../fe-react/vite.config.js), [API client React](../fe-react/src/services/apiClient.js), [ma trận C01–C21 và kết quả giai đoạn 8](./react-migration-progress.md), [README React](../fe-react/README.md).

## Slide 22 — Ba lỗi kỹ thuật tiêu biểu và cách xử lý

### Nội dung đưa lên slide

| Lỗi có bằng chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Form bộ lọc danh sách điểm bị nhân đôi | Hai component cùng cấp dùng cùng React key | Tách key theo component; bổ sung test lọc/phân trang/Back–Forward |
| Lazy-load component lỗi khi chạy dev và E2E song song | Hai Vite server cùng ghi cache optimized dependencies | Tách cacheDir cho mode E2E và dev |
| Lệnh E2E bỏ sót test feature | Cấu hình chỉ tìm test trong thư mục e2e | Mở rộng discovery để chạy cả browser tests trong từng feature |

Không có thước đo độ khó để xếp hạng “khó nhất”; đây là ba lỗi tiêu biểu đã được ghi nhận và có cách sửa. Không tự gán lỗi CORS/SQL/async nếu không có bằng chứng lịch sử.

### 1. React key trùng làm nhân đôi form

- Nhật ký review ngày 04–05/11 ghi sau một lần lọc, số form tăng từ 1 lên 2, ID input bị trùng và console báo duplicate key.
- Hai sibling GradeFilters và GradeResults trước đó cùng dùng `key={formKey}`.
- Bản hiện tại đã sửa:

```jsx
<GradeFilters key={`filters:${formKey}`} filters={filters} meta={meta.data} onApply={apply} />
<GradeResults key={`results:${formKey}`} query={grades} onPageChange={setPage} />
```

- Bổ sung regression test để chỉ còn một form khi lọc, phân trang, Back/Forward và refetch; nhật ký giai đoạn 4 xác nhận sửa và chạy lại bộ kiểm tra.

**Nguồn:** [GradeListPage.jsx](../fe-react/src/features/grades/GradeListPage.jsx), [ReadPages.test.jsx](../fe-react/src/features/lookup/ReadPages.test.jsx), [E2E trang đọc](../fe-react/e2e/read-pages.spec.js), [nhật ký review/giai đoạn 4](./react-migration-progress.md).

### 2. Vite dev và E2E xung đột cache

- Nhật ký giai đoạn 3 ghi lỗi lazy-load component gallery khi hai dev server chạy đồng thời.
- Nguyên nhân được ghi nhận: dùng chung optimized-dependency cache, server này làm thay đổi cache server kia.
- Cấu hình hiện tại tách cache theo mode:

```javascript
// Parallel dev and E2E servers must not rewrite each other's optimized deps.
cacheDir: mode === 'e2e' ? 'node_modules/.vite-e2e' : 'node_modules/.vite',
```

- Nhật ký ghi chạy lại 12/12 đạt sau tách cache; sau khi bổ sung ca cross-tab/token sai, bộ test giai đoạn đó đạt 14/14. Đây là số liệu lịch sử của giai đoạn 3, không phải tổng test hiện tại.

**Nguồn:** [vite.config.js](../fe-react/vite.config.js), [nhật ký giai đoạn 3](./react-migration-progress.md).

### 3. Playwright bỏ sót test quản trị và thống kê

- Cấu hình cũ chỉ discover thư mục e2e; 12 ca browser ở các feature quản trị/thống kê không nằm trong lệnh kiểm tra chính.
- Các ca riêng có thể đạt nhưng vẫn bị bỏ qua khi nhóm chạy lệnh mặc định, khiến kết quả tổng hợp thiếu coverage.
- Đã đưa các test `src/features/**/tests/browser/*.spec.js` vào discovery chung và cập nhật tài liệu; cấu hình production chỉ loại các bài preview component dành cho dev.
- Nhật ký giai đoạn 4 ghi đã xử lý discovery, cùng các lỗi key/selector, và bộ E2E cuối đợt đạt 33/33. Không xem fixture là bằng chứng ghi DB thật.

**Nguồn:** [Playwright config](../fe-react/playwright.config.js), [production config](../fe-react/playwright.production.config.js), [nhật ký review/giai đoạn 4](./react-migration-progress.md).

## Ghi chú sử dụng tài liệu

- Dùng phần “Nội dung đưa lên slide” cho slide chính; đưa mã dài, bảng nghiệm thu và giải thích vào speaker notes.
- Frontend trong bộ slide là React; slide 15 trích API client của React, các màn hình là page/component JSX và điều hướng bằng React Router.
- Không tự thêm ngày hoàn thành, thành viên phụ trách, quy trình PR hoặc tỷ lệ hoàn thành mà repository chưa chứng minh.
- Các liên kết nguồn tương đối được tính từ tài liệu này; không chứa bản sao mật khẩu cấu hình.
