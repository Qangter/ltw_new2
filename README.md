# Website Tra cứu Kết quả Thi Trực tuyến

Frontend: HTML/CSS/JavaScript thuần · Backend: Node.js + Express · Database: MySQL 8.x (`diem_thi`)

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
fe/         Giao diện SPA (được Express phục vụ tĩnh)
  index.html      khung trang, chỉ chứa <div id="app">, #toast, #templates
  css/style.css   toàn bộ style
  js/app.js       JavaScript thuần: routing, gọi API, gắn dữ liệu vào DOM (không chứa HTML)
  pages/*.html    khung HTML tĩnh của từng trang (dashboard, lookup, entry, grades, stats, students, users...)
  pages/common.html      các <template> dùng chung (thẻ thống kê, thanh tỷ lệ, phân trang)
  pages/modals/*.html    nội dung các hộp thoại (thêm/sửa sinh viên, lịch sử sửa điểm)
```

Backend giữ nguyên URL API và hợp đồng request/response; route chuyển request tới controller, controller dùng model để truy cập dữ liệu và service cho nghiệp vụ dùng chung. Các trang HTML trong `fe/pages/` là phần View của giao diện.

## Cài đặt (Windows)
1. Tạo database: `mysql -u root -p < database\full_setup.sql`
2. `cd be` → `copy .env.example .env` rồi sửa `DB_PASSWORD` (mật khẩu MySQL) và `JWT_SECRET`
3. `npm install`
4. `npm start`
5. Mở http://localhost:3000

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
