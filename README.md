# Website Tra cứu Kết quả Thi Trực tuyến

Frontend: React/Vite JavaScript (frontend duy nhất) · Backend: Node.js + Express · Database: MySQL 8.x (`diem_thi`).

React dùng `createHashRouter`/`RouterProvider` giữ URL hash, TanStack Query cho dữ liệu server và Auth Context cho phiên/quyền. Service/query hook tách theo feature; draft nhập điểm tách khỏi cache theo enrollment ID. GPA, thống kê, quyền và kết quả import do API quyết định. Xem [kiến trúc frontend](./fe-react/README.md), [baseline](./docs/react-migration-baseline.md) và [ma trận nghiệm thu hiện hành](./docs/react-migration-progress.md).

**Trạng thái:** đã có cấu hình chạy bản build React qua Express; chưa nghiệm thu đầy đủ các luồng ghi DB thật của giai đoạn 5–7. Lỗi backend B02 vẫn là đề xuất riêng, chưa sửa quyền nghiệp vụ trong migration.

## Cấu trúc
```
database/   SQL tạo DB + dữ liệu mẫu (500 SV, 25 GV, ~12.000 điểm), verify.sql, Excel mẫu
be/         Express API theo MVC
  routes/       khai báo endpoint và middleware
  controllers/  xử lý request/response và điều phối nghiệp vụ
  models/       truy vấn, thao tác dữ liệu MySQL
  services/     nghiệp vụ dùng chung (ví dụ tính và lưu điểm)
  middleware/   xác thực, phân quyền và xử lý lỗi request
  config/       cấu hình kết nối MySQL
fe-react/   React/Vite, component/service/query hook và tests
  dist/         build production được Express phục vụ mặc định
```

Backend giữ nguyên URL API và hợp đồng request/response; route chuyển request tới controller, controller dùng model để truy cập dữ liệu và service cho nghiệp vụ dùng chung. Các component JSX trong [fe-react/src](./fe-react/src/) là phần giao diện; CSS và logo nằm trong chính ứng dụng React.

## Cài đặt (Windows)
Các bước tạo DB dưới đây chỉ dành cho lần cài mới. Với database có sẵn, giữ cấu hình/dữ liệu hiện tại; không chạy lại setup/seed để migration hoặc kiểm thử.

1. Tạo database: `mysql -u root -p < database\full_setup.sql`
2. `cd be` → `copy .env.example .env` rồi sửa `DB_PASSWORD` (mật khẩu MySQL) và `JWT_SECRET`
3. `npm install`
4. Trở về root repository, chạy `npm --prefix fe-react ci` rồi `npm --prefix fe-react run build`.
5. Chạy `npm --prefix be start`, mở http://localhost:3000/#/login.

## Build và chạy React bằng Express

Yêu cầu Node `^22.13.0 || ^24.0.0 || >=26.0.0`; MySQL và cấu hình backend hiện có. Chạy từ root repository (dùng `npm.cmd` nếu PowerShell chặn npm.ps1):

```powershell
npm --prefix fe-react ci
npm --prefix fe-react run lint
npm --prefix fe-react test
npm --prefix fe-react run build
npm --prefix be run start:react
```

Mở http://localhost:3000/#/login. Dừng tiến trình đang chiếm cổng trước khi chạy; hoặc dùng `npm --prefix be run start:react -- 3001` để xem ở http://localhost:3001/#/login nếu cổng 3000 đang được sử dụng. Script hỗ trợ chọn cổng, không sửa file cấu hình hay dữ liệu.

Cả `npm --prefix be start` và `npm --prefix be run start:react` đều phục vụ React. Backend không còn đọc biến `FRONTEND`; giá trị cũ trong môi trường/file cấu hình không đổi giao diện. Script `start:react` vẫn nhận cổng tùy chọn để tương thích lệnh chạy hiện có.

API giữ nguyên thứ tự routes → JSON 404 `/api` → static. Thiếu build React trả HTTP 503 và hướng dẫn build. Hash route trực tiếp và refresh dùng cùng index. URL không có hash và asset không tồn tại trả 404 text, không trả HTML giả cho JavaScript/API. Index dùng `no-cache`, asset React có hash dùng cache immutable. Production gọi `/api` cùng origin, không cần Vite/proxy hoặc bí mật DB trong bundle.

Phát triển: chạy backend cùng `npm --prefix fe-react run dev`; xem http://127.0.0.1:5173. Chi tiết biến proxy và lệnh test trong [README React](./fe-react/README.md).

## Frontend React độc lập

Frontend cũ đã được gỡ. [CSS nền](./fe-react/src/styles/base.css) và [logo](./fe-react/src/assets/images/logo.png) được giữ nguyên nội dung và đóng gói bằng Vite; không còn import từ thư mục bên ngoài React.

Sau khi sửa frontend, build lại rồi tải lại trình duyệt. Khi cần khôi phục phiên bản trước, dùng bản phát hành/commit đã lưu và build lại; không còn lệnh chuyển sang giao diện cũ. Database và API không đổi trong lần chuyển này.

Kiểm tra: `npm --prefix be run test:frontend` (static fixture), `npm --prefix be run test:frontend:live` (Express/MySQL thật, chỉ HTTP đọc), `npm --prefix fe-react run test:e2e:production` (giao diện production). Xem [hướng dẫn React](./fe-react/README.md) để bật các ca đọc API thật bằng `LIVE_AUTH=1`.

## Tài khoản demo
| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Admin | admin | admin123 |
| Giáo viên | teacher01 … teacher25 | teacher123 |
| Sinh viên | student001 … student500 | student123 |

## Chức năng và phân quyền
| Chức năng | Admin | Giáo viên | Sinh viên |
|---|:-:|:-:|:-:|
| Xem bảng điểm, GPA của chính mình | | | ✔ |
| Tra cứu SV theo tên/mã, xem bảng điểm chi tiết | ✔ | ✔ | |
| Nhập/sửa/xóa điểm tay | ✔ (mọi lớp) | ✔ (lớp mình dạy) | |
| Import Excel | ✔ | ✔ (môn mình dạy) | |
| Danh sách điểm + lọc + lịch sử sửa điểm | ✔ | ✔ | |
| Thống kê đạt/rớt, dashboard | ✔ | ✔ | |
| Quản lý sinh viên, tài khoản | ✔ | | |
| Đổi mật khẩu | ✔ | ✔ | ✔ |

## API chính (JWT: header `Authorization: Bearer <token>`)
`POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/change-password`
`GET /api/students?q=&class_id=&page=` · `GET /api/students/:id/transcript` · `GET /api/students/me/transcript` · `POST|PUT|DELETE /api/students`
`GET /api/offerings` · `GET /api/offerings/:id/students` · `POST /api/offerings/:id/enroll`
`PUT /api/grades/enrollment/:id` · `DELETE /api/grades/:id` · `GET /api/grades` · `GET /api/grades/:id/history`
`POST /api/import/grades` (multipart, field `file`) · `GET /api/import/template`
`GET /api/stats/{overview,by-subject,by-semester,distribution,by-department}`
`GET /api/admin/users` · `PATCH /api/admin/users/:id/active` · `POST /api/admin/users/:id/reset-password`

## Bảo mật
Mật khẩu bcrypt, JWT 8 giờ, phân quyền kiểm tra ở server, mọi truy vấn SQL dùng tham số (`?`), giới hạn file import 5MB/5000 dòng, giao diện escape HTML chống XSS.

## Import Excel
Cột: `student_code, full_name, subject_code, subject_name, credits, semester_name, academic_year, score`. File mẫu: `database/sample_grades.xlsx`. Hệ thống tìm lớp học phần theo mã môn + học kỳ; nếu SV chưa đăng ký sẽ tự tạo đăng ký. Dòng lỗi được liệt kê kèm số dòng. Điểm import ghi vào điểm cuối kỳ/tổng kết; mỗi lần điểm tổng kết đổi đều ghi `grade_history`.
