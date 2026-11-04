# Baseline chuyển frontend sang React — giai đoạn 1

Ngày khảo sát: 03/11/2026. Phạm vi: đọc code và lập hợp đồng chuyển đổi, không sửa ứng dụng.

## 1. Mức độ xác minh và nguồn chuẩn

- **Đã xác minh tĩnh:** 12 route màn hình, 27 endpoint, quyền middleware/controller/model, template, quy tắc điểm/GPA, tác động dữ liệu và cấu hình phục vụ frontend.
- **Đã chạy:** 24 assertion trực tiếp trên các hàm thuần xử lý điểm, không kết nối database.
- **Chưa xác minh tích hợp:** request GET không xác thực tới `http://localhost:3000/api/auth/me` không kết nối được. Không suy ra MySQL hỏng hoặc backend không chạy ở cổng khác. Không khởi động server, đọc thông tin bí mật hay ghi dữ liệu thử.
- Node quan sát được: `v22.19.0`; npm: `10.9.3`. Chưa có frontend React hoặc cấu hình lint/build frontend.
- Những mô tả “trả về”, “cho phép”, “cập nhật” dưới đây là hợp đồng suy ra từ code hiện tại, không phải kết quả gọi API thật.

Nguồn:

| Nội dung | Nguồn |
|---|---|
| Router, màn hình, state, API đang dùng | [app.js](../fe/js/app.js), [pages](../fe/pages/), [index.html](../fe/index.html) |
| CSS, responsive, in | [style.css](../fe/css/style.css) |
| Mount API/static, lỗi chung | [server.js](../be/server.js) |
| Auth và role | [routes/auth](../be/routes/auth.js), [middleware/auth](../be/middleware/auth.js), [authController](../be/controllers/authController.js), [userModel](../be/models/userModel.js) |
| Sinh viên/bảng điểm | [routes/students](../be/routes/students.js), [studentsController](../be/controllers/studentsController.js), [studentModel](../be/models/studentModel.js) |
| Điểm/import/metadata | [routes/grades](../be/routes/grades.js), [gradesController](../be/controllers/gradesController.js), [gradeModel](../be/models/gradeModel.js) |
| Tính/lưu điểm | [utils/grade](../be/utils/grade.js), [gradeService](../be/services/gradeService.js) |
| Thống kê | [routes/stats](../be/routes/stats.js), [statsController](../be/controllers/statsController.js), [statsModel](../be/models/statsModel.js) |
| Quản trị tài khoản | [routes/admin](../be/routes/admin.js), [adminController](../be/controllers/adminController.js), [adminModel](../be/models/adminModel.js) |
| Kiểu dữ liệu và khóa ngoại | [schema](../database/02_schema.sql), [DB config](../be/config/db.js) |
| Cách chạy và dependencies | [README](../README.md), [package.json backend](../be/package.json) |

Khi README/nhãn giao diện và code khác nhau, ghi lại khác biệt; không tự sửa backend hoặc đổi nghiệp vụ trong đợt chuyển frontend.

## 2. Kiến trúc và điều hướng hiện tại

Express mount API trước static frontend, có JSON 404 riêng cho `/api`, rồi phục vụ [fe](../fe/). Server chỉ bắt đầu listen sau khi `SELECT 1` thành công; cổng mặc định 3000, có thể thay bằng cấu hình.

Frontend nạp template HTML bằng fetch, cache trong `pageCache`, clone các template và gắn event handler thủ công. Hash đổi thì dựng lại layout. Metadata được cache trong biến toàn cục, xóa khi logout. Bộ lọc/page hiện nằm trong biến cục bộ, không lưu URL. Không có server logout hoặc API refresh token.

Quy ước: A = ADMIN, T = TEACHER, S = STUDENT; “staff” = A hoặc T.

| ID | Route hash giữ nguyên | Màn hình / view hiện tại | Vai trò UI | Hành động và API (ID ở mục 4) |
|---|---|---|---|---|
| R01 | `#/login` | Đăng nhập / `renderLogin` | Chưa đăng nhập | AUTH01; khôi phục phiên AUTH02 |
| R02 | `#/dashboard` | Tổng quan / `vDashboard` | A, T | ST01, ST03, ST04, ST05; 8 thẻ số liệu, thanh tỷ lệ học kỳ, donut điểm chữ và sinh viên theo khoa |
| R03 | `#/my` | Bảng điểm của tôi / `vMy` | S | META01, SV02; lọc học kỳ, GPA, nhóm bảng theo học kỳ, in |
| R04 | `#/lookup` | Tra cứu sinh viên / `vLookup` | A, T | META01, SV01; tìm mã/tên, lớp, phân trang, mở R05 |
| R05 | `#/student/:id` | Bảng điểm chi tiết / `vStudent` | A, T | META01, SV03; giống R03, thêm quay lại tra cứu |
| R06 | `#/entry` | Nhập/sửa điểm / `vEntry` | A, T | META01, HP01–03, DIEM01–02; học kỳ, lớp học phần, thêm SV, lưu dòng, lưu các dòng đổi, xóa |
| R07 | `#/import` | Import Excel / `vImport` | A, T | IMP01–02; tải mẫu, chọn file, nhập và xem thống kê/lỗi |
| R08 | `#/grades` | Danh sách điểm / `vGrades` | A, T | META01, DIEM03–04; lọc, phân trang, xem lịch sử; không sửa trực tiếp tại trang này |
| R09 | `#/stats` | Thống kê / `vStats` | A, T | ST01–04; 4 thẻ, thanh học kỳ, phân bố điểm chữ, bảng theo môn |
| R10 | `#/students` | Quản lý sinh viên / `vStudents` | A | META01, SV01, SV04–06; lọc, phân trang, modal thêm/sửa, xóa |
| R11 | `#/users` | Tài khoản / `vUsers` | A | TK01–03; lọc mã đăng nhập/tên/role, phân trang, khóa/mở, reset mật khẩu |
| R12 | `#/password` | Đổi mật khẩu / `vPassword` | A, T, S | AUTH03; xác nhận mật khẩu mới ở frontend |

Quy tắc router hiện tại:

- Chưa có `user`: hiển thị login dù hash đang là route khác.
- Đã đăng nhập và hash rỗng hoặc login: chọn `my` cho S, `dashboard` cho staff.
- Route không thuộc menu của role: chuyển về trang mặc định; S vào `student/:id` cũng về `my`.
- Chi tiết sinh viên dùng menu active của tra cứu. `:id` là ID hồ sơ sinh viên, không phải mã SV hoặc user ID.
- Logout ở layout: xóa `token`, `user`, metadata rồi hiển thị login.
- Giữ tên route cũ khi dùng HashRouter; không tự đổi `my` hoặc `student/:id` theo ví dụ trong thảo luận trước.

## 3. Ma trận quyền thực tế

Ma trận được đối chiếu ở backend; việc ẩn menu không thay thế kiểm soát server.

| Hành động | A | T | S | Ghi chú |
|---|---|---|---|---|
| Đọc metadata; đổi mật khẩu bản thân | Có | Có | Có | Auth bắt buộc |
| Xem bảng điểm bản thân qua `/students/me/transcript` | Không | Không | Có | Endpoint riêng cho S |
| Tra cứu danh sách SV, xem bảng điểm SV bất kỳ | Có | Có | Không | Không giới hạn lớp dạy ở chức năng đọc này |
| Xem danh sách điểm và lịch sử | Có | Có | Không | Không lọc theo teacher tại model lịch sử/danh sách |
| Dashboard và mọi thống kê | Có | Có | Không | Thống kê toàn hệ thống, không riêng giáo viên |
| Liệt kê lớp học phần | Tất cả | Lớp có `teachers.user_id` khớp tài khoản | Không | Có lọc học kỳ tùy chọn |
| Xem SV trong lớp học phần | Tất cả | Lớp mình dạy | Không | Có kiểm tra chủ sở hữu lớp |
| Thêm SV vào lớp, lưu/xóa điểm | Tất cả | Lớp mình dạy | Không | Đối chiếu offering qua enrollment/grade |
| Tải mẫu Excel | Có | Có | Không | Trả file, vẫn cần token |
| Import điểm | Có | Lớp phù hợp môn+học kỳ của giáo viên | Không | Ngoại lệ hồ sơ giáo viên thiếu: B02 ở mục 8 |
| Tạo/sửa/xóa SV | Có | Không | Không | Tạo/xóa gắn với tài khoản |
| Danh sách tài khoản, khóa/mở, reset mật khẩu | Có | Không | Không | Chặn PATCH trạng thái chính tài khoản admin |

Không tự giới hạn dữ liệu đọc của T về lớp riêng trong React. Nếu sản phẩm muốn đổi quyền này, cần yêu cầu riêng sửa backend và hợp đồng.

## 4. Hợp đồng API — đủ 27 endpoint

### 4.1. Quy ước chung và kiểu response

- Prefix `/api`; gửi `Authorization: Bearer <token>` trừ login. JSON body cho thao tác thường; multipart cho import; blob cho tải mẫu.
- Lỗi thông thường `{ message: string }`. Thiếu/hỏng/hết token: 401; không đúng role: 403; route API lạ: 404. Lỗi ngoài dự kiến: 500 với `Lỗi máy chủ`.
- Thành công mặc định 200; tạo sinh viên và đăng ký lớp 201.
- `Page<T> = { data: T[], total, page, limit, pages }`; `pages = ceil(total/limit)`, bằng 0 khi rỗng. Page tối thiểu 1 nhưng không bị ép về trang cuối.
- `Student = { id, student_code, full_name, date_of_birth, gender, class_id, email, phone, address, admission_year, status, class_code, major_name, department_name }`.
- `StudentInput = { student_code? (bắt buộc lúc tạo), full_name, date_of_birth, gender?, class_id, email?, phone?, address?, admission_year, status?, password? (chỉ lúc tạo) }`.
- `Transcript = { student: Student, grades: TranscriptGrade[], summary: { subjects, credits, passed_credits, failed_subjects, gpa } }`.
- `TranscriptGrade = { grade_id, subject_code, subject_name, credits, semester_id, semester_name, academic_year, teacher_name, attendance_score, midterm_score, final_score, total_score, letter_grade, result }`.
- `GradeListRow = { id, student_code, full_name, subject_code, subject_name, credits, semester_name, teacher_name, total_score, letter_grade, result, updated_at, edits }`.
- `UserRow = { id, username, full_name, email, role, is_active, created_at }`.
- MySQL config dùng `dateStrings: true`, `decimalNumbers: true`. Không parse ngày sinh qua timezone để tránh lệch ngày. Numeric aggregate/string cụ thể vẫn cần xác minh trên API thật.

### 4.2. Auth — nguồn: authController + userModel + middleware/auth

| ID | Endpoint / màn hình | Input | Response thành công | Lỗi riêng |
|---|---|---|---|---|
| AUTH01 | `POST /api/auth/login` — R01 | `{ username, password }`; server trim username, không trim password | `{ token, user: { id, username, full_name, role } }` | 400 thiếu thông tin; 401 sai tài khoản/mật khẩu; 403 tài khoản bị khóa |
| AUTH02 | `GET /api/auth/me` — khởi động | Token | `{ id, username, full_name, email, role }`; S có thêm `student_id`, `student_code` nếu có hồ sơ | 401 tài khoản không tồn tại; không kiểm tra is_active tại đây |
| AUTH03 | `POST /api/auth/change-password` — R12 | `{ old_password, new_password }`; UI cũ gửi thêm `confirm` nhưng server bỏ qua | `{ message }` | 400 mật khẩu mới dưới 6 ký tự; mật khẩu cũ sai |

JWT chứa `id`, `role`, `username`, hạn 8 giờ. Frontend cũ lưu localStorage `token`, `user`, khi khởi động gọi `/me` và merge user. Mọi lỗi `/me` đều khiến bản cũ logout; JSON localStorage lỗi chưa được catch. Không tự đưa refresh token/cookie vào migration. Reset/đổi mật khẩu không cấp token mới và không thu hồi JWT cũ (B01).

### 4.3. Sinh viên — nguồn: studentsController + studentModel

| ID | Endpoint / màn hình | Input | Response | Lỗi riêng |
|---|---|---|---|---|
| SV01 | `GET /api/students` — R04, R10 | `q`, `class_id`, `status`, `page`, `limit` | `Page<Student>` | Lỗi chung; page ngoài phạm vi trả data rỗng |
| SV02 | `GET /api/students/me/transcript` — R03 | `semester_id?` | `Transcript` của S từ user ID trong token | 404 không có hồ sơ SV |
| SV03 | `GET /api/students/:id/transcript` — R05 | ID hồ sơ + `semester_id?` | `Transcript` | 404 không có SV |
| SV04 | `POST /api/students` — R10 | `StudentInput` | 201 `{ id, message }` | 400 thiếu trường/mã SV/giới tính/trạng thái/lớp không tồn tại; 409 trùng mã hoặc username |
| SV05 | `PUT /api/students/:id` — R10 | `StudentInput` nhưng không đổi mã SV; cần đủ trường bắt buộc | `{ message }` | 400 validation; 404 không tìm thấy; lỗi FK ở nhánh update không được ánh xạ riêng như create |
| SV06 | `DELETE /api/students/:id` — R10 | ID hồ sơ | `{ message }` | 404 không có SV; 409 đã có đăng ký/điểm, nên đổi trạng thái |

- `q` tìm chứa mã SV hoặc họ tên; lọc `status` bằng so sánh trực tiếp. Sort mã SV tăng dần.
- Limit mặc định 10, tối thiểu 1, tối đa 100; UI tra cứu gửi 10, UI quản trị gửi 12.
- Bắt buộc `full_name`, `class_id`, `date_of_birth`, `admission_year`. Mã mới phải khớp `[A-Za-z0-9]{3,30}`. Gender MALE/FEMALE/OTHER; status ACTIVE/GRADUATED/SUSPENDED.
- Backend mặc định gender OTHER, status ACTIVE khi bỏ trống. Form tạo cũ mặc định gender MALE, status ACTIVE, admission_year là năm hiện tại.
- Tạo SV và user cùng transaction; username = mã SV viết thường; password do API nhận nếu có, mặc định `student123`. UI cũ không có ô password khi tạo.
- Update đồng bộ `users.full_name`, không đồng bộ `users.email`. Không được tự hứa rằng email tài khoản sẽ thay đổi cùng email SV.
- Xóa thực chất xóa user, cascade hồ sơ SV; enrollment dùng FK RESTRICT nên chặn xóa SV đã có đăng ký. Không chỉ trường hợp “đã có điểm”.

### 4.4. Metadata, lớp học phần và điểm — nguồn: gradesController + gradeModel + gradeService

| ID | Endpoint / màn hình | Input | Response | Lỗi riêng |
|---|---|---|---|---|
| META01 | `GET /api/meta` — R03–06, R08, R10 | Token của A/T/S | `{ semesters, subjects, classes }` theo mô tả dưới | Lỗi chung |
| HP01 | `GET /api/offerings` — R06 | `semester_id?` | Array `{ id, subject_code, subject_name, credits, semester_name, teacher_name, room, schedule, enrolled }` | Lỗi chung; không có lớp trả `[]` |
| HP02 | `GET /api/offerings/:id/students` — R06 | Offering ID | Array `{ enrollment_id, student_code, full_name, grade_id, attendance_score, midterm_score, final_score, total_score, letter_grade, result }` | 404 không có lớp; 403 không phải lớp T |
| HP03 | `POST /api/offerings/:id/enroll` — R06 | `{ student_code }`, trim trên server | 201 `{ message }` | 404 lớp/SV; 403 lớp ngoài quyền; 409 đã đăng ký |
| DIEM01 | `PUT /api/grades/enrollment/:enrollmentId` — R06 | `{ attendance_score?, midterm_score?, final_score, reason? }` | `{ id, total, letter, result, created }`; `id` là grade ID | 404 enrollment/lớp; 403 lớp ngoài quyền; 400 điểm không hợp lệ |
| DIEM02 | `DELETE /api/grades/:id` — R06 | Grade ID | `{ message }` | 404 không có điểm/lớp; 403 lớp ngoài quyền |
| DIEM03 | `GET /api/grades/:id/history` — modal R08 | Grade ID | Array `{ old_score, new_score, old_result, new_result, changed_by, reason, changed_at }` | ID không có lịch sử trả `[]`, không có kiểm tra tồn tại grade riêng |
| DIEM04 | `GET /api/grades` — R08 | `q`, `semester_id`, `subject_id`, `class_id`, `result`, `page`, `limit` | `Page<GradeListRow>` | Lỗi chung |

Metadata:

- `semesters`: `{ id, semester_code, semester_name, academic_year, status }`, sort start_date tăng dần.
- `subjects`: `{ id, subject_code, subject_name, credits }`, sort subject_code.
- `classes`: `{ id, class_code, class_name }`, sort class_code.
- Cả ba mảng đều không lọc theo vai trò. Đây là dữ liệu tham chiếu, không có trang CRUD môn/lớp/học kỳ trong phạm vi hiện tại.

Lớp và danh sách điểm:

- HP02 có thể trả SV chưa có điểm, lúc đó grade fields null. Dùng enrollment ID làm key cho draft, không dùng grade ID null.
- UI chọn học kỳ ACTIVE đầu tiên, nếu không có thì học kỳ cuối danh sách. Mảng học kỳ rỗng hiện gây lỗi ở UI cũ (F04).
- HP01 sort mã môn; HP02 sort mã SV. Không có phân trang hoặc API lưu batch cho bảng nhập điểm.
- DIEM04 default limit 15, phạm vi 1–100; page tối thiểu 1; sort updated_at DESC rồi id DESC. Kết quả lọc chỉ nhận PASSED/FAILED, giá trị khác được bỏ qua.
- UI R08 hiện chỉ có q, semester_id, subject_id, result; `class_id` được API hỗ trợ nhưng chưa có control. Không bắt buộc thêm control mới để đạt tương đương.
- `edits` là số bản ghi lịch sử, không phải số lần bấm Lưu. UI chỉ hiện nút lịch sử khi edits khác 0. Lịch sử sort changed_at DESC, id DESC; `changed_by` là họ tên user, có thể null.

### 4.5. Import — nguồn: routes/grades + gradesController + gradeModel

| ID | Endpoint / màn hình | Input | Response | Lỗi riêng |
|---|---|---|---|---|
| IMP01 | `GET /api/import/template` — R07 | Token staff | Blob XLSX; filename `excel_template.xlsx`; MIME spreadsheetml.sheet | Lỗi chung |
| IMP02 | `POST /api/import/grades` — R07 | Multipart field `file`, tối đa `5 * 1024 * 1024` bytes | `{ total, created, updated, failed, errors: [{ row, message }] }` | 400 thiếu file, không đọc được, không có dữ liệu, thiếu cột, >5000 dòng, quá dung lượng; lỗi từng dòng nằm trong response 200 |

- Template có 8 cột: student_code, full_name, subject_code, subject_name, credits, semester_name, academic_year, score.
- Backend **chỉ bắt buộc và xử lý nghiệp vụ 4 cột**: student_code, subject_code, semester_name, score. Không tạo/cập nhật họ tên, môn, tín chỉ hoặc năm học theo các cột mô tả còn lại.
- Đọc sheet đầu tiên; `sheet_to_json(..., { defval: '' })`; tối đa 5000 bản ghi đọc được. Server không có filter extension/MIME riêng; UI hiện accept `.xlsx,.xls`. Không mô tả việc kiểm tra phần mở rộng ở frontend như bảo đảm của backend.
- semester_name có thể khớp tên hoặc mã học kỳ. SV và môn phải tồn tại; không tự tạo hai đối tượng này.
- Chọn offering phù hợp môn+học kỳ (và teacher nếu có). Ưu tiên offering SV đã đăng ký, sau đó offering ID nhỏ nhất. Không dùng academic_year/class_id trong file để chọn thêm.
- Mỗi dòng có transaction riêng: tạo enrollment nếu cần rồi lưu điểm. Dòng sau lỗi không rollback các dòng trước đã commit.
- Import gọi saveGrade với attendance=null, midterm=null, final=score, nên **ghi đè/xóa điểm CC/GK cũ về null** và total=score. Đây là hành vi hiện có phải trình bày đúng.
- `updated` tăng cho mỗi lần lưu vào grade đã có, kể cả tổng điểm không thay đổi. Một file có thể chứa nhiều dòng cùng đối tượng; server xử lý tuần tự, không dedupe trước.
- `failed` là tổng số dòng lỗi; `errors` chỉ chứa tối đa **100 lỗi đầu**. Không dùng `errors.length` thay cho failed hoặc hứa hiển thị toàn bộ lỗi.
- Giá trị `row` được server tính theo index record + 2. Với sheet có hàng trống bị parser bỏ qua, số này có thể không khớp tuyệt đối số hàng Excel; hiển thị nguyên giá trị API.
- Không có endpoint tiến độ hoặc hủy transaction toàn file. Khi mất mạng không tự retry import vì có thể đã ghi một phần.

### 4.6. Thống kê — nguồn: statsController + statsModel

Tất cả là GET, không có bộ lọc query được controller xử lý, chỉ staff, phạm vi toàn hệ thống.

| ID | Endpoint / màn hình | Response |
|---|---|---|
| ST01 | `GET /api/stats/overview` — R02, R09 | `{ students, teachers, subjects, classes, grades, avg_score, passed, failed, pass_rate, fail_rate }` |
| ST02 | `GET /api/stats/by-subject` — R09 | Array `{ subject_code, subject_name, total, avg_score, passed, pass_rate }`, sort subject_code |
| ST03 | `GET /api/stats/by-semester` — R02, R09 | Array `{ semester_code, semester_name, total, avg_score, passed, pass_rate }`, sort start_date |
| ST04 | `GET /api/stats/distribution` — R02, R09 | Array `{ letter_grade, total }`, thứ tự A+, A, B+, B, C+, C, D, F |
| ST05 | `GET /api/stats/by-department` — R02 | Array `{ department_name, students }`, sort số SV giảm dần, gồm khoa có 0 SV |

Lỗi riêng: không có nhánh validation ở controller, áp dụng lỗi auth/role/server chung. `avg_score` là trung bình bản ghi điểm, không trọng số tín chỉ; khác GPA của bảng điểm. Overview không có điểm thì rates=0, passed/failed=0, avg_score có thể null. Nhóm môn/học kỳ/phân bố chỉ trả nhóm có điểm; không tự hiểu thiếu nhóm là lỗi.

### 4.7. Tài khoản — nguồn: adminController + adminModel

| ID | Endpoint / màn hình | Input | Response | Lỗi riêng |
|---|---|---|---|---|
| TK01 | `GET /api/admin/users` — R11 | `q`, `role`, `page`; role ngoài A/T/S bỏ qua | `Page<UserRow>`, limit cố định 15, sort id ASC | Lỗi chung |
| TK02 | `PATCH /api/admin/users/:id/active` — R11 | `{ is_active: boolean }` | `{ message }` | 400 khi target là chính user đăng nhập; 404 không có user |
| TK03 | `POST /api/admin/users/:id/reset-password` — R11 | ID; không cần body | `{ message }`, thông báo chứa mật khẩu mặc định theo role | 404 không có user |

TK02 dùng truthiness của body.is_active, vì vậy gửi boolean thực, không gửi chuỗi `"false"`. Guard self-ID chặn cả khóa lẫn mở khóa dù thông báo chỉ nói không thể tự khóa. Reset mặc định A=`admin123`, T=`teacher123`, S=`student123`; không có chức năng nhập mật khẩu tùy chọn trên màn hình hiện tại.

## 5. Quy tắc điểm, GPA, lịch sử và định dạng

### 5.1. Parse và tính tổng

Nguồn chuẩn: [utils/grade](../be/utils/grade.js).

- undefined, null, chuỗi rỗng hoặc toàn khoảng trắng: optional trả null; required ném 400.
- CC/GK optional, CK required. Điểm 0 hợp lệ và khác bỏ trống.
- Chuyển dấu phẩy thập phân sang chấm trước Number; phải hữu hạn, trong [0,10] **trước khi làm tròn**; làm tròn 2 chữ số bằng Math.round.
- Nếu **một trong hai** CC hoặc GK là null: tổng = CK (làm tròn 2 chữ số), không cần cả hai cùng trống.
- Nếu cả CC/GK có giá trị: tổng = round2(CC × 0.1 + GK × 0.3 + CK × 0.6).
- Ví dụ `(10,8,9) → 8.8`, `(null,8,9) → 9`, `(10,null,9) → 9`, `(0,0,0) → 0`.

| Tổng đã làm tròn | Chữ | Kết quả |
|---|---|---|
| 9–10 | A+ | PASSED |
| 8.5–<9 | A | PASSED |
| 8–<8.5 | B+ | PASSED |
| 7–<8 | B | PASSED |
| 6.5–<7 | C+ | PASSED |
| 5.5–<6.5 | C | PASSED |
| 5–<5.5 | D | PASSED |
| <5 | F | FAILED |

React lấy `total`, `letter`, `result` từ response lưu, không gửi giá trị tự tính làm nguồn chính thức. Nhãn trong template không phải nguồn công thức thay thế backend.

### 5.2. Lưu, lịch sử và xóa

Nguồn: [gradeService](../be/services/gradeService.js), [schema](../database/02_schema.sql).

- Mỗi enrollment có tối đa một grade. PUT tạo mới nếu chưa có, update nếu đã có.
- Tạo grade không tạo dòng lịch sử; nếu enrollment đang ENROLLED thì chuyển COMPLETED.
- Update ghi lịch sử **chỉ khi total_score thay đổi**; sửa thành phần nhưng tổng không đổi không thêm lịch sử. Default reason nếu không truyền là `Cập nhật điểm`.
- UI nhập tay truyền `Cập nhật điểm thủ công`; import truyền `Import từ file Excel`.
- Lịch sử lưu tổng cũ/mới, kết quả cũ/mới, người sửa, lý do; không chứa đầy đủ điểm thành phần cũ.
- Xóa grade cascade xóa lịch sử, giữ enrollment, không đặt lại trạng thái enrollment trong code hiện có. Không có undo API.
- “Lưu tất cả” hiện gọi PUT tuần tự cho dòng dirty. Không có giao dịch toàn bảng; React phải thể hiện thành công một phần và giữ draft dòng lỗi.

### 5.3. Bảng điểm và GPA

Nguồn: [studentModel](../be/models/studentModel.js).

- Chỉ lấy enrollment đã có grade (INNER JOIN grades); không đưa môn chưa có điểm vào GPA.
- `subjects` là số bản ghi điểm trả về, không phải COUNT DISTINCT môn. Nếu một môn có nhiều lượt có điểm, model không chọn điểm cao nhất/gần nhất; giữ nguyên tập bản ghi.
- `credits` = tổng tín chỉ các bản ghi; `passed_credits` = tổng tín chỉ của bản ghi PASSED; `failed_subjects` đếm bản ghi không PASSED.
- `gpa = round2(sum(total_score × credits)/sum(credits))`, thang **10**, không phải thang 4. Nếu không có tín chỉ thì gpa=null.
- Lọc semester_id tác động cả danh sách lẫn summary/GPA; không hiển thị GPA đã lọc như GPA toàn khóa.
- Sort theo start_date, mã môn. UI nhóm theo tên học kỳ; React có thể key bằng semester_id để ổn định mà không đổi dữ liệu hiển thị.

### 5.4. Định dạng, bảng và in

- `num`: null/undefined → dấu `—`, số → làm tròn tối đa 2 chữ số, không ép hiển thị `.00`.
- Ngày sinh `YYYY-MM-DD` → `DD/MM/YYYY` bằng cắt chuỗi. Lịch sử hiện hiển thị changed_at nguyên chuỗi.
- Bảng có overflow ngang; responsive hiện tại tại 820px và 520px. Không bỏ cột nghiệp vụ khi chuyển đổi.
- In dùng `window.print()`, CSS ẩn sidebar, toolbar, no-print, toast; bỏ shadow card. Chưa có xuất PDF/API in.
- CSS cũ chưa xử lý đầy đủ overflow/min-width cho bảng khi in; phải kiểm tra print preview sau chuyển đổi, không chỉ giữ nút In.

## 6. Ánh xạ sang React (đề xuất cho giai đoạn 2–7, chưa tạo code)

Đích mặc định: React + Vite + JavaScript/JSX, HashRouter, TanStack Query, Auth Context; giữ API cùng prefix `/api`. Các tên dưới là đề xuất mới, không phải file đã tồn tại.

| Nguồn hiện có | Page/component/hook đề xuất | Giai đoạn |
|---|---|---|
| [index](../fe/index.html), [shell](../fe/pages/shell.html), render/MENU | AppProviders, AppRouter, AppLayout, Sidebar, route config theo role | 2–3 |
| api/qs/ensureMeta trong [app.js](../fe/js/app.js) | apiClient, feature services, useMeta, query key helpers | 3–4 |
| [common](../fe/pages/common.html), clone/setF/setBadge | StatCard, ProgressBar, Badge, Pagination; thay template bằng JSX | 2 |
| toast/loading/openModal | ToastProvider, LoadingState, EmptyState, ErrorState, Modal, ConfirmDialog | 2 |
| [login](../fe/pages/login.html), renderLogin/init/logout | LoginPage, AuthProvider, useAuth, ProtectedRoute, RoleGuard | 3 |
| [password](../fe/pages/password.html), vPassword | ChangePasswordPage, form/mutation | 3 |
| [dashboard](../fe/pages/dashboard.html), vDashboard | DashboardPage, DonutChartCSS, useOverview/useStats | 4 |
| [lookup](../fe/pages/lookup.html), vLookup | LookupPage, StudentSearchForm, StudentResultsTable, useStudents | 4 |
| [transcript](../fe/pages/transcript.html), showTranscript/vMy/vStudent | MyTranscriptPage, StudentTranscriptPage, TranscriptView, SemesterGradeTable, useTranscript | 4 |
| [grades](../fe/pages/grades.html), [history modal](../fe/pages/modals/grade-history.html), vGrades | GradeListPage, GradeFilters, GradeHistoryModal, useGrades/useGradeHistory | 4 |
| [stats](../fe/pages/stats.html), vStats | StatisticsPage, SubjectStatsTable, useStats | 4 |
| [students](../fe/pages/students.html), [form](../fe/pages/modals/student-form.html), vStudents | StudentsPage, StudentFormModal, useStudentMutations | 5 |
| [users](../fe/pages/users.html), vUsers | UsersPage, UserActions, useUsers/useUserMutations | 5 |
| [entry](../fe/pages/entry.html), vEntry | GradeEntryPage, OfferingSelector, GradeEntryRow, useGradeDrafts/useGradeMutations | 6 |
| [import](../fe/pages/import.html), vImport | ImportPage, FilePicker, ImportResult, useGradeImport | 7 |
| [style.css](../fe/css/style.css), [logo](../fe/assets/images/logo.png) | Styles/assets React, giữ nhận diện và nhãn tiếng Việt | 2, hoàn thiện ở 8 |

Phân chia state:

- Auth Context: user đã xác minh, token/phiên, trạng thái khởi tạo; không dựa vào role localStorage để xác nhận quyền.
- Query cache: metadata, danh sách, transcript, offerings, stats, lịch sử; key gồm mọi filter/page/ID, phân tách hoặc reset theo phiên.
- URL: các bộ lọc đã áp dụng và page; form bộ lọc đang gõ có thể là local state để giữ hành vi submit hiện tại.
- Local state/form: modal, file chọn, validation, draft điểm theo enrollment ID. Refetch nền không được ghi đè draft.
- Logout/đổi người dùng: hủy request, bỏ cache theo phiên; response cũ không được cập nhật phiên mới.

Tác động dữ liệu để invalidate sau mutation (không cần refetch mọi thứ vô điều kiện):

| Mutation | Nhóm dữ liệu cần làm mới khi liên quan |
|---|---|
| Tạo/sửa/xóa SV | Danh sách SV, transcript hồ sơ, users (tạo/xóa/đổi tên), overview và phân bố khoa khi số lượng/lớp đổi; danh sách điểm/offering students khi tên/mã/lớp hiển thị liên quan |
| Thêm SV vào offering | Danh sách SV offering, enrolled count của offerings |
| Lưu/xóa điểm | Offering students, grades, transcript, history, stats; giữ draft chưa lưu khác |
| Import | Các nhóm điểm ở trên, offerings vì có thể tạo enrollment; không tự giả định tạo SV/môn |
| Khóa/mở/reset tài khoản | Users nếu dữ liệu hiển thị thay đổi; không hứa JWT cũ đã bị thu hồi |

## 7. Checklist tương đương và nghiệm thu tương lai

Các ô chưa đánh dấu là công việc cần kiểm tra khi có React/API thật; **không phải giai đoạn 1 còn thiếu khảo sát**.

| ID | Kịch bản cần kiểm tra | Kết quả cần đạt | Giai đoạn |
|---|---|---|---|
| C01 | Login A/T/S, sai mật khẩu, tài khoản khóa | Đúng trang mặc định; phân biệt 401/403 và lỗi mạng | 3 |
| C02 | Refresh phiên; storage hỏng; token hết hạn; logout/đổi tài khoản khi request đang chạy | Không lộ dữ liệu cache phiên trước; không crash hoặc dùng role chưa xác minh | 3 |
| C03 | Mở trực tiếp từng route bằng 3 role; gọi API ngoài quyền | Đúng ma trận; frontend không thay quyền backend | 3, 8 |
| C04 | Tra cứu mã/tên/lớp và phân trang 10; kết quả rỗng; page ngoài phạm vi | Đúng dữ liệu và số trang; có empty state, không trắng trang | 4 |
| C05 | My transcript và student/:id; đổi học kỳ; chưa có điểm; ID không tồn tại | Đúng endpoint, summary lọc cùng danh sách, GPA thang 10, null khác 0 | 4 |
| C06 | In bảng điểm dài ở print preview | Không sidebar/nút; không mất cột hoặc dữ liệu vì vùng cuộn | 4, 8 |
| C07 | Dashboard, stats với cả A và T | Số liệu toàn hệ thống giống API; avg khác GPA; chart rỗng hợp lệ | 4 |
| C08 | Danh sách điểm: q/học kỳ/môn/kết quả; pagination 15; lịch sử có/không có | Sort, số edits, old/new/changed_by/reason đúng hợp đồng | 4 |
| C09 | Tạo SV hợp lệ, trùng mã, sai lớp; sửa hồ sơ, xóa SV đã đăng ký | Thông báo 400/409 đúng; form giữ dữ liệu khi lỗi; không tự thay backend | 5 |
| C10 | Lọc SV trạng thái/lớp và pagination 12; xóa dòng cuối trang | Bảng/cache/điều hướng trang hợp lý | 5 |
| C11 | Lọc users; khóa/mở; tự khóa; reset mật khẩu | ADMIN-only, request boolean, xử lý 400/404, xác nhận đúng đối tượng | 5 |
| C12 | Học kỳ rỗng, không có offering, lớp rỗng, T truy cập lớp người khác | Empty state rõ; quyền ghi bị server chặn | 6 |
| C13 | Điểm 0, null/blank, 8,5; thiếu CK; <0 hoặc >10; biên xếp loại | Khớp parseScore/calcTotal/classify và response backend | 6 |
| C14 | Tạo grade mới rồi xóa ngay; sửa tổng không đổi/tổng đổi | Dùng grade ID mới; chỉ tổng đổi tăng lịch sử | 6 |
| C15 | Lưu tất cả có dòng lỗi; double click; chỉnh sửa/refetch/đổi lớp/rời trang trong lúc pending | Không mất draft, báo đúng phần thành công, không gửi batch tưởng tượng | 6 |
| C16 | Tải mẫu, import file hợp lệ; file rỗng/sai/thiếu cột/>5000 dòng/>5MiB | Blob/FormData chuẩn; phân biệt lỗi request với lỗi dòng | 7 |
| C17 | Import nhiều dòng lỗi, >100 lỗi; môn/học kỳ/mã SV sai; T sai lớp | failed tổng đúng, errors có thể bị cắt, quyền dựa server | 7 |
| C18 | Import vào grade có CC/GK; dòng trùng; mất mạng sau gửi | Hiểu CC/GK về null, xử lý tuần tự, không tự retry ghi | 7 |
| C19 | Thay đổi bộ lọc nhanh, Back/Forward, refetch nền, lỗi API | Không hiển thị kết quả cũ sai filter; phân biệt loading/rỗng/lỗi | 4–8 |
| C20 | Responsive, focus/keyboard modal, toast, nhãn và dấu tiếng Việt | Không bỏ chức năng, thao tác được bàn phím | 2, 8 |
| C21 | Build production qua Express; refresh hash; API lạ; rollback | Asset đúng, API 404 JSON, đổi về frontend cũ được | 8 |

- [ ] C01–C03: xác thực và quyền đã nghiệm thu tích hợp.
- [ ] C04–C08: trang đọc dữ liệu đã đối chiếu API thật.
- [ ] C09–C11: quản trị đã kiểm tra trên dữ liệu thử xác định.
- [ ] C12–C15: nhập điểm và bảo vệ draft đã nghiệm thu.
- [ ] C16–C18: import đã nghiệm thu dữ liệu và quyền.
- [ ] C19–C21: trải nghiệm, production build và rollback đã nghiệm thu.

## 8. Lỗi/hạn chế hiện có và đề xuất riêng

Đây là phát hiện qua code, chưa tái hiện qua trình duyệt/API thật. Không sửa ở giai đoạn 1. Không coi tất cả hành vi cũ là yêu cầu phải sao chép lỗi.

### 8.1. Frontend — xử lý khi xây React trong phạm vi kế hoạch

| ID | Bằng chứng | Ảnh hưởng / chuyển giao |
|---|---|---|
| F01 | `showTranscript.draw` trong [app.js](../fe/js/app.js) gắn listener change cho cùng select mỗi lần draw | Có thể nhân số request sau nhiều lần đổi học kỳ; React dùng handler khai báo, không đăng ký lặp |
| F02 | `vLookup.load`, `vGrades.load`, `vStudents.load`: append empty template rồi gọi `renderPager(container, null)`; renderPager xóa container trước return | Empty message bị xóa; tách vùng bảng/empty và pager |
| F03 | `vEntry.saveRow` chỉ cập nhật total/letter/result, không cập nhật grade ID và nút xóa | Sau tạo điểm mới không xóa ngay được như mong đợi; React nhận response.id |
| F04 | `vEntry` truy cập active.id khi semesters có thể rỗng | Cần empty state, không đọc thuộc tính undefined |
| F05 | `api` không hỗ trợ AbortSignal; các view dùng selector toàn document và không có guard response cũ; draft ở DOM | Có thể request muộn đụng trang mới/mất draft; kiểm tra race và tách server state/draft |
| F06 | JSON.parse localStorage không catch; init logout với mọi lỗi /me | Storage hỏng có thể chặn khởi động; phân biệt lỗi phiên với lỗi mạng trong React |
| F07 | openModal có aria-modal nhưng không có focus trap/Escape/restore focus; download không revoke object URL | Cải thiện component dùng chung và cleanup khi chuyển đổi |
| F08 | CSS print chỉ ẩn điều hướng/nút, chưa gỡ overflow/min-width; user list không có empty state riêng | Cần kiểm tra trực quan, không đánh dấu đạt chỉ vì nút in/bảng tồn tại |

### 8.2. Backend — chỉ ghi nhận, không âm thầm sửa hoặc bù bằng UI

| ID | Phát hiện và bằng chứng | Đề xuất xử lý riêng / trạng thái |
|---|---|---|
| B01 | [auth middleware](../be/middleware/auth.js) chỉ verify JWT; [userModel.findById](../be/models/userModel.js) không lấy is_active; đổi/reset mật khẩu không revoke JWT | Khóa tài khoản chặn login mới nhưng không vô hiệu hóa ngay token đang tồn tại. Muốn thu hồi phiên cần thiết kế backend riêng. Không chặn giai đoạn 2; test future phải phản ánh hạn chế này |
| B02 | [gradesController.importGrades](../be/controllers/gradesController.js) lấy teacherId có thể undefined; [gradeModel.findImportOffering](../be/models/gradeModel.js) chỉ thêm filter teacher khi giá trị truthy | Nếu tài khoản TEACHER thiếu hồ sơ teachers, import có thể chọn offering không bị giới hạn teacher. Đề xuất backend từ chối khi không tìm được teacher ID trước import. Cần kiểm thử riêng; không đổi quyền bằng lọc UI |
| B03 | [studentsController.update](../be/controllers/studentsController.js) không map lỗi FK như create; [studentModel.update](../be/models/studentModel.js) cập nhật students và users bằng 2 query không transaction | Một số lỗi trả 500 hoặc có thể lệch dữ liệu nếu query sau thất bại. Đề xuất xử lý lỗi/transaction riêng; không tự thêm endpoint hoặc đổi schema |
| B04 | [studentModel.update](../be/models/studentModel.js) chỉ đồng bộ tên user, không email | Email hồ sơ và tài khoản có thể khác nhau; xác nhận nghiệp vụ nếu muốn đồng bộ, không đưa vào migration mặc định |

Không có lỗi backend nào hiện ngăn việc tạo khung React ở giai đoạn 2. Những thay đổi backend trên cần phạm vi giao việc riêng; chưa thực hiện, chưa tuyên bố đã khắc phục.

## 9. Kiểm tra đã thực hiện và điểm bàn giao

| Kiểm tra | Kết quả |
|---|---|
| `git status --short` trước khảo sát | Có 2 tài liệu untracked từ trước: [kế hoạch](./ke-hoach-chuyen-frontend-react.md), [nội dung thuyết trình](./noi-dung-thuyet-trinh-du-an-15-slide.md); giữ nguyên |
| Tìm AGENTS.md tại root và trong phạm vi fe/be/docs/database (bỏ node_modules) | Không tìm thấy hướng dẫn repository riêng tại các vị trí đó |
| Đọc route/controller/model/service/template | Kiểm kê 27 endpoint và 12 route màn hình; mọi endpoint có input/response/quyền/lỗi hoặc ghi rõ lỗi chung |
| `node --version`, `npm.cmd --version` | v22.19.0, 10.9.3 |
| `node` đọc script assertion qua stdin, import utils/grade | 24 assertion đạt; không DB, không mock API |
| `Invoke-WebRequest -Uri http://localhost:3000/api/auth/me -UseBasicParsing -TimeoutSec 5` | Không kết nối được; không có HTTP response để đánh giá hợp đồng runtime |
| Lint/build | Không chạy: chỉ tạo Markdown; frontend React chưa tồn tại, backend chỉ có start/dev |

Chưa kiểm tra GPA qua dữ liệu MySQL, quyền thực tế qua API, import/lưu/xóa qua database, responsive và print preview. Không có dữ liệu runtime giả dùng làm bằng chứng.

**Bàn giao:** đủ dữ kiện để thực hiện giai đoạn 2 theo [kế hoạch](./ke-hoach-chuyen-frontend-react.md). Giữ nguyên các route ở mục 2 và hợp đồng ở mục 4. Trạng thái từng giai đoạn được theo dõi trong [nhật ký tiến độ](./react-migration-progress.md).
