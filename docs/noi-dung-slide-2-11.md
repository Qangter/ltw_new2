# Nội dung slide 2–11 — Frontend React

**Dự án:** Website tra cứu kết quả thi trực tuyến.  
**Phạm vi:** Frontend [fe-react](../fe-react/), backend Express, database MySQL.  
**Ngày cập nhật:** 08/11/2026.

Tài liệu thay thế phần mô tả slide 2–11 trước đó trong hội thoại. Các màn hình là React page/component JSX; toàn bộ ví dụ frontend lấy từ mã React. Phần tiếp theo: [slide 12–22](./noi-dung-slide-12-22.md) và [slide 23–30](./noi-dung-slide-23-30.md).

## Slide 2 — Mục tiêu

**Lý do chọn đề tài:** Quản lý và tra cứu điểm là nhu cầu thiết thực trong học tập. Đề tài hướng đến tập trung dữ liệu, hạn chế tổng hợp thủ công và vận dụng kiến thức lập trình web vào bài toán thực tế.

**Bốn mục tiêu cụ thể:**

- **Quản lý tập trung:** Lưu hồ sơ sinh viên và kết quả học tập; cung cấp chức năng theo vai trò Admin, Lecturer và Student.
- **Hỗ trợ cập nhật điểm:** Nhập/sửa điểm trực tiếp hoặc từ Excel, kiểm tra dữ liệu, tự tính tổng kết và ghi lịch sử thay đổi tổng điểm.
- **Tra cứu thuận tiện:** Sinh viên xem bảng điểm cá nhân theo học kỳ, GPA thang 10 và số tín chỉ đạt.
- **Thống kê kết quả:** Tổng hợp điểm trung bình, tỷ lệ đạt/rớt và phân bố điểm để theo dõi tình hình học tập.

Các lợi ích là mục tiêu của sản phẩm, không phải số liệu đã đo về mức giảm thời gian/sai sót. Mỗi mục tiêu trên dưới 50 từ.

**Nguồn:** [README React](../fe-react/README.md), [cấu hình route React](../fe-react/src/app/routeConfig.js), [route backend](../be/routes/).

## Slide 3 — Tổng quan hệ thống

Ứng dụng React phục vụ ba vai trò, sử dụng API Express và dữ liệu tập trung trong MySQL:

- **Admin — Quản trị viên:** Quản lý hồ sơ sinh viên và tài khoản; nhập, cập nhật, tra cứu và thống kê điểm toàn hệ thống.
- **Lecturer — Giảng viên:** Nhập/sửa/xóa và import điểm theo phân công giảng dạy. Tra cứu bảng điểm, xem lịch sử thay đổi và thống kê.
- **Student — Sinh viên:** Xem/in bảng điểm cá nhân, lọc học kỳ, theo dõi GPA và tín chỉ đạt; đổi mật khẩu.

Trong source, Lecturer có mã role **TEACHER**. Điều hướng mặc định: Admin/Giảng viên tới `#/dashboard`, Sinh viên tới `#/my`.

**Nguồn:** [routeConfig](../fe-react/src/app/routeConfig.js), [AppRoutes](../fe-react/src/app/AppRoutes.jsx), [routes backend](../be/routes/).

## Slide 4 — Phân quyền

| Thao tác | Admin | Lecturer / TEACHER | Student |
|---|---|---|---|
| Đăng nhập, xem thông tin tài khoản, đổi mật khẩu | Có | Có | Có |
| Tra cứu sinh viên và bảng điểm | Có | Có | Chỉ bảng điểm bản thân |
| Xem lớp học phần và sinh viên trong lớp | Mọi lớp | Lớp phụ trách | Không |
| Thêm sinh viên vào lớp học phần | Mọi lớp | Lớp phụ trách | Không |
| Nhập, sửa, xóa điểm | Mọi lớp | Lớp phụ trách | Không |
| Tải mẫu/import Excel | Có | Theo phân công giảng dạy* | Không |
| Danh sách điểm, lịch sử và thống kê | Có | Có | Không |
| Thêm/sửa/xóa hồ sơ sinh viên | Có | Không | Không |
| Danh sách, khóa/mở khóa tài khoản, reset mật khẩu | Có | Không | Không |

React lọc menu và kiểm tra route theo role; backend vẫn kiểm tra quyền cho mỗi API. Các API đọc tra cứu/lịch sử/thống kê hiện chưa giới hạn đồng nhất theo lớp giảng viên. Xóa sinh viên bị chặn khi có dữ liệu đăng ký/điểm; Admin không được thay trạng thái chính tài khoản đang đăng nhập.

*Import còn lỗi B02: TEACHER thiếu hồ sơ liên kết có thể làm mất điều kiện lọc teacherId. Đây là hạn chế chưa sửa, không mô tả phân quyền import là hoàn thiện tuyệt đối.

**Nguồn:** [AuthGate/RoleGuard](../fe-react/src/features/auth/AuthGate.jsx), [menu và role](../fe-react/src/app/routeConfig.js), [middleware backend](../be/middleware/auth.js), [controller điểm](../be/controllers/gradesController.js), [model điểm](../be/models/gradeModel.js), [baseline B02](./react-migration-baseline.md).

## Slide 5 — Use Case chính

**Chung:**

- Đăng nhập / đăng xuất.
- Đổi mật khẩu.

**Admin:**

- Quản lý hồ sơ sinh viên.
- Khóa/mở khóa và reset mật khẩu tài khoản.
- Tra cứu sinh viên, bảng điểm.
- Thêm sinh viên vào lớp học phần.
- Nhập/sửa/xóa điểm; import Excel.
- Xem lịch sử, dashboard và thống kê.

**Lecturer:**

- Xem lớp học phần phụ trách.
- Thêm sinh viên vào lớp phụ trách.
- Nhập/sửa/xóa điểm và import theo phân công.
- Tra cứu bảng điểm, xem lịch sử và thống kê.

**Student:**

- Xem bảng điểm cá nhân.
- Lọc theo học kỳ.
- Theo dõi GPA và tín chỉ đạt.
- In bảng điểm.

Không đưa “sinh viên tự đăng ký học phần”, “phúc khảo” hoặc “Admin tạo tài khoản giảng viên tùy ý” vào nhóm chức năng đã có. Tạo sinh viên hiện tự tạo tài khoản STUDENT đi kèm.

**Nguồn:** [AppRoutes](../fe-react/src/app/AppRoutes.jsx), [các feature React](../fe-react/src/features/), [routes backend](../be/routes/), [controller sinh viên](../be/controllers/studentsController.js).

## Slide 6 — Chức năng và yêu cầu phi chức năng

**Chức năng cốt lõi đã code:**

- Xác thực JWT và phân quyền ba vai trò.
- Quản lý hồ sơ sinh viên và trạng thái tài khoản.
- Nhập/sửa/xóa điểm, validate 0–10, tính tổng kết/xếp loại.
- Import Excel và báo lỗi theo dòng.
- Tra cứu bảng điểm, lọc học kỳ, GPA thang 10 có trọng số tín chỉ.
- Dashboard/thống kê và lịch sử thay đổi tổng điểm.

| Yêu cầu phi chức năng | Biểu hiện trong source |
|---|---|
| **Bảo mật** | Backend dùng bcrypt, JWT 8 giờ, kiểm tra role và quyền lớp; React guard route và xóa cache khi đổi phiên; SQL có tham số. |
| **Hiệu năng** | Phân trang server; MySQL pool tối đa 10 kết nối; TanStack Query dùng cache, staleTime mặc định 30 giây và AbortSignal để hủy request không còn cần thiết. |
| **UI/khả dụng** | Component dùng chung, responsive 820px/520px, trạng thái loading/error/empty, modal hỗ trợ bàn phím và định dạng in bảng điểm. |

Các cơ chế này đã có trong code; không suy ra đã đạt mọi tiêu chí bảo mật, thời gian phản hồi hay tải đồng thời.

**Nguồn:** [auth backend](../be/middleware/auth.js), [auth controller](../be/controllers/authController.js), [MySQL pool](../be/config/db.js), [model sinh viên](../be/models/studentModel.js), [queryClient](../fe-react/src/app/queryClient.js), [authSession](../fe-react/src/features/auth/authSession.js), [API client](../fe-react/src/services/apiClient.js), [CSS React](../fe-react/src/styles/index.css), [Modal](../fe-react/src/components/overlay/Modal.jsx).

## Slide 7 — Công nghệ sử dụng

| Tầng / mục đích | Công nghệ và thư viện thực tế |
|---|---|
| Frontend | React 19, React DOM, JavaScript/JSX, CSS |
| Điều hướng | React Router; createHashRouter/RouterProvider giữ URL dạng `#/...` |
| Dữ liệu API | TanStack Query, Fetch API, service/query hook theo feature |
| Form và phiên | React Hook Form; Auth Context và auth session |
| Build | Vite và plugin React |
| Kiểm thử frontend | Vitest, Testing Library, jsdom, Playwright; ESLint kiểm tra mã |
| Backend | Node.js, Express, dotenv, cors |
| Xác thực | jsonwebtoken, bcryptjs |
| Import và DB client | multer, xlsx, mysql2 |
| Database | MySQL 8.x, InnoDB, utf8mb4 |

**Lý do lựa chọn đề xuất để thuyết trình:** “React giúp tái sử dụng component và quản lý giao diện theo trạng thái; MySQL phù hợp với dữ liệu học vụ có quan hệ chặt chẽ, cần khóa ngoại và transaction.”

Đây là giải thích về sự phù hợp của kiến trúc, không phải trích dẫn quyết định lịch sử của nhóm. MySQL là hệ quản trị CSDL, không phải framework frontend. Không giữ câu hỏi “vì sao không dùng framework frontend” vì ứng dụng hiện dùng React.

**Nguồn:** [manifest frontend](../fe-react/package.json), [App](../fe-react/src/app/App.jsx), [providers](../fe-react/src/app/AppProviders.jsx), [manifest backend](../be/package.json), [schema](../database/02_schema.sql).

## Slide 8 — Kiến trúc và luồng request

**React Page → service/query hook → Fetch API client → Express → Route/Middleware → Controller → Model/Service → MySQL → JSON → query cache/state → React render.**

1. Người dùng thao tác với component; React Hook Form hoặc state giữ giá trị đầu vào.
2. Service/query hook gọi API client; client thêm Bearer token, JSON/FormData và AbortSignal.
3. Express định tuyến; middleware xác minh JWT/role; controller kiểm tra đầu vào và quyền nghiệp vụ.
4. Model dùng mysql2 truy vấn MySQL; service xử lý nghiệp vụ dùng chung như tính/lưu điểm.
5. Controller trả HTTP status và JSON; query cache/state nhận dữ liệu, component render kết quả hoặc lỗi.

**Ví dụ:** `MyTranscriptPage` → query/service bảng điểm → `/api/students/me/transcript` → xác minh STUDENT → tìm student theo user ID → JOIN dữ liệu/tính GPA → `TranscriptView` hiển thị.

Backend không phải mọi request đều bắt buộc qua cả Model và Service: service lưu điểm có SQL trực tiếp; controller đọc bảng điểm gọi model. JSON là dữ liệu, frontend không lấy HTML từ API để thay màn hình.

**Nguồn:** [MyTranscriptPage](../fe-react/src/features/transcripts/MyTranscriptPage.jsx), [transcriptService](../fe-react/src/features/transcripts/transcriptService.js), [API client](../fe-react/src/services/apiClient.js), [server](../be/server.js), [routes sinh viên](../be/routes/students.js), [controller](../be/controllers/studentsController.js), [model](../be/models/studentModel.js), [service điểm](../be/services/gradeService.js).

## Slide 9 — Database

Database **diem_thi có 12 bảng**. Tất cả dùng `id INT UNSIGNED AUTO_INCREMENT` làm khóa chính.

| Bảng | Ý nghĩa | Khóa ngoại |
|---|---|---|
| departments | Khoa | Không có |
| majors | Ngành | department_id → departments.id |
| users | Tài khoản | Không có |
| teachers | Giảng viên | user_id → users.id; department_id → departments.id |
| classes | Lớp sinh viên | major_id → majors.id; advisor_teacher_id → teachers.id |
| students | Sinh viên | user_id → users.id; class_id → classes.id |
| subjects | Môn học | department_id → departments.id |
| semesters | Học kỳ | Không có |
| course_offerings | Lớp học phần | subject_id → subjects.id; semester_id → semesters.id; teacher_id → teachers.id; class_id → classes.id |
| enrollments | Đăng ký học phần | student_id → students.id; course_offering_id → course_offerings.id |
| grades | Điểm | enrollment_id → enrollments.id; updated_by → users.id |
| grade_history | Lịch sử điểm | grade_id → grades.id; changed_by → users.id |

**Quan hệ quan trọng:** Sinh viên N–N lớp học phần qua enrollments; mỗi enrollment có tối đa một grade do UNIQUE(enrollment_id); một grade có nhiều bản ghi history. UNIQUE(student_id, course_offering_id) ngăn đăng ký trùng.

**Nguồn:** [schema SQL](../database/02_schema.sql). Phần CSDL không thay đổi theo việc dùng React ở frontend.

## Slide 10 — Giao diện React

### Tám màn hình tiêu biểu

| Màn hình | Hash route | Page/component React |
|---|---|---|
| Tổng quan | `#/dashboard` | [DashboardPage.jsx](../fe-react/src/features/dashboard/DashboardPage.jsx) |
| Tra cứu sinh viên | `#/lookup` | [LookupPage.jsx](../fe-react/src/features/lookup/LookupPage.jsx) |
| Bảng điểm cá nhân | `#/my` | [MyTranscriptPage.jsx](../fe-react/src/features/transcripts/MyTranscriptPage.jsx), dùng chung [TranscriptView.jsx](../fe-react/src/features/transcripts/TranscriptView.jsx) |
| Nhập/sửa điểm | `#/entry` | [GradeEntryPage.jsx](../fe-react/src/features/grade-entry/GradeEntryPage.jsx) |
| Import Excel | `#/import` | [ImportPage.jsx](../fe-react/src/features/import/ImportPage.jsx) |
| Thống kê | `#/stats` | [StatisticsPage.jsx](../fe-react/src/features/statistics/StatisticsPage.jsx) |
| Quản lý sinh viên | `#/students` | [StudentsPage.jsx](../fe-react/src/features/students/StudentsPage.jsx) |
| Quản lý tài khoản | `#/users` | [UsersPage.jsx](../fe-react/src/features/users/UsersPage.jsx) |

Đây là tám màn hình được chọn để trình bày, không phải toàn bộ ứng dụng. [AppRoutes](../fe-react/src/app/AppRoutes.jsx) còn khai báo đăng nhập, đổi mật khẩu, danh sách điểm và bảng điểm sinh viên theo ID; các màn hình dùng JSX, không có một trang HTML riêng cho từng chức năng.

### Màu sắc và font đang áp dụng cho React

| Vai trò | Mã HEX |
|---|---|
| Chủ đạo / đậm / nền nhạt | #3b82f6 / #2563eb / #dbeafe |
| Nền trang / nền thẻ | #f1f5f9 / #ffffff |
| Chữ chính / chữ phụ | #0f172a / #64748b |
| Đường viền | #e2e8f0 |
| Thành công / lỗi / cảnh báo | #10b981 / #ef4444 / #f59e0b |

Font nền của ứng dụng: **Inter**, dự phòng system-ui, -apple-system, Segoe UI, Roboto, sans-serif. Điểm nạp style là [index.css của React](../fe-react/src/styles/index.css); file này import stylesheet dùng chung và bổ sung style component, responsive, trạng thái và bản in. Các token nền được nạp qua import, không phải khai báo mới trực tiếp trong index.css.

Component phản hồi dùng chung: [QueryState](../fe-react/src/components/feedback/QueryState.jsx), [EmptyState](../fe-react/src/components/feedback/EmptyState.jsx), [ToastProvider](../fe-react/src/components/feedback/ToastProvider.jsx). Dữ liệu biểu đồ nhận từ API qua props, ví dụ [DistributionChart](../fe-react/src/features/statistics/components/DistributionChart.jsx).

## Slide 11 — Cấu trúc code

### Cây thư mục rút gọn

```text
fe-react/
├── index.html                 # Điểm vào duy nhất, không phải các trang nghiệp vụ
├── vite.config.js             # Build, dev server, proxy API, Vitest
└── src/
    ├── main.jsx               # Mount ứng dụng React
    ├── app/                   # Router, providers, query config, guard điều hướng
    ├── components/            # UI, layout, feedback, overlay dùng chung
    ├── features/              # Page, service, hook và component theo chức năng
    ├── hooks/                 # Hook dùng chung
    ├── services/              # API client và metadata service
    ├── styles/                # CSS đầu vào và quy tắc giao diện React
    ├── utils/                 # Định dạng và tiện ích
    └── test/                  # Setup và fixture cho kiểm thử

be/
├── server.js                  # Khởi động Express, mount route và handler lỗi
├── config/                    # MySQL pool và phục vụ frontend build
├── routes/                    # Endpoint và middleware
├── controllers/               # Kiểm tra request, điều phối, trả response
├── models/                    # Truy vấn và cập nhật MySQL
├── services/                  # Nghiệp vụ dùng chung, ví dụ lưu điểm
├── middleware/                # Xác thực, role, chuyển lỗi async
└── utils/                     # Chuẩn hóa, công thức và xếp loại điểm
```

**Giải thích một câu cho từng tầng:**

- **Routes:** Ánh xạ URL/phương thức HTTP tới middleware và controller.
- **Controllers:** Kiểm tra request, điều phối nghiệp vụ và trả HTTP response.
- **Models:** Thực hiện truy vấn và cập nhật dữ liệu trong MySQL.
- **Views:** Trong dự án này là React page/component JSX, nhận state/props để hiển thị và phát sinh thao tác; không có thư mục backend tên views.

**Phân biệt test với ứng dụng:** [authFixtures.js](../fe-react/src/test/authFixtures.js) tạo storage và fetch bằng `vi.fn()` để test. [AuthProvider](../fe-react/src/features/auth/AuthProvider.jsx) dùng [authSession](../fe-react/src/features/auth/authSession.js) với fetch mặc định cho ứng dụng thật; không import fixture để đăng nhập production.

**Nguồn:** [frontend React](../fe-react/), [src](../fe-react/src/), [backend](../be/), [App](../fe-react/src/app/App.jsx), [API client](../fe-react/src/services/apiClient.js), [manifest](../fe-react/package.json).
