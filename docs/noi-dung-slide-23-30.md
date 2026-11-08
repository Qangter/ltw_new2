# Nội dung slide 23–30 — Kiểm thử, triển khai và tổng kết

**Dự án:** Website tra cứu kết quả thi trực tuyến.  
**Ngày đối chiếu:** 08/11/2026.  
**Căn cứ:** Source code trong working tree, README, Git remote và nhật ký migration cập nhật ngày 06/11/2026.

Tài liệu tiếp nối [slide 12–22](./noi-dung-slide-12-22.md). Mỗi slide có nội dung trình chiếu và phần giải thích để dùng làm ghi chú. Các test case đề xuất chưa được coi là đã chạy. Kết quả kiểm thử được dẫn từ nhật ký, không phải một lượt kiểm thử mới khi soạn tài liệu này. Không thực thi setup database, demo ghi điểm hoặc deploy trong lần biên soạn.

**Phạm vi frontend:** Toàn bộ thao tác, validation, ví dụ và kiểm thử giao diện đề cập đến ứng dụng [React](../fe-react/). [authFixtures.js](../fe-react/src/test/authFixtures.js) chỉ dùng để tạo phiên/fetch giả trong test, không phải API client production.

## PHẦN 5 — Kiểm thử và triển khai

## Slide 23 — Test case đăng nhập và nhập điểm

### Nội dung đưa lên slide

- **Đăng nhập:** Đúng/sai thông tin; thiếu trường; tài khoản khóa; token sai/hết hạn; truy cập sai vai trò.
- **Nhập điểm:** Giá trị hợp lệ; biên 0 và 10; thiếu cuối kỳ; ngoài khoảng; dữ liệu không phải số.
- **Nghiệp vụ:** Đúng lớp phụ trách; tính tổng kết/xếp loại; ghi lịch sử khi sửa tổng điểm.
- **Độ tin cậy:** Chống gửi lặp; giữ bản nháp khi lỗi; lưu nhiều dòng thành công một phần; rollback khi ghi lỗi.

### Nhóm test đăng nhập

API chính: `POST /api/auth/login`. Các ca token/role kiểm tra thêm API được bảo vệ sau đăng nhập.

| Mã | Loại | Dữ liệu / thao tác | Kết quả mong đợi theo code |
|---|---|---|---|
| LG01 | Hợp lệ | Tài khoản hoạt động, đúng mật khẩu; lần lượt ADMIN/TEACHER/STUDENT | HTTP 200, trả token và user; React xác minh lại qua `/api/auth/me`; staff về dashboard, student về bảng điểm |
| LG02 | Hợp lệ | Username có khoảng trắng đầu/cuối, thông tin còn lại đúng | Username được trim; đăng nhập thành công |
| LG03 | Không hợp lệ | Thiếu username hoặc password | UI báo lỗi bắt buộc; nếu gọi API trực tiếp với trường thiếu/rỗng thì trả 400 |
| LG04 | Không hợp lệ | Username chỉ gồm khoảng trắng | UI chặn; gọi API trực tiếp với chuỗi khoảng trắng không rỗng sẽ qua kiểm tra ban đầu, trim rồi không tìm được user, thường trả 401 |
| LG05 | Không hợp lệ | Username không tồn tại hoặc mật khẩu sai | 401 và cùng thông báo “Sai tên đăng nhập hoặc mật khẩu”; không cấp token |
| LG06 | Không hợp lệ | Tài khoản bị khóa, mật khẩu đúng | 403 “Tài khoản đã bị khóa”; không cấp token |
| LG07 | Phiên | Gọi API được bảo vệ không có token, token giả hoặc hết hạn | 401; request đã mang token mà bị 401 làm frontend kết thúc phiên |
| LG08 | Phân quyền | STUDENT gọi API quản trị hoặc nhập điểm | 403; React chặn route trái quyền; không thay đổi dữ liệu |
| LG09 | Bất đồng bộ | Nhấn đăng nhập nhiều lần khi request đang chờ | Form bị khóa khi submitting; không gửi lặp từ thao tác UI thông thường |
| LG10 | Hạ tầng | Mất mạng hoặc API trả 500 khi đăng nhập | Hiện lỗi, không điều hướng như đăng nhập thành công; cho phép người dùng thử lại |

**Lưu ý:** Không gán yêu cầu mật khẩu tối thiểu 6 ký tự cho form login; ràng buộc đó nằm ở chức năng đổi mật khẩu. Tài khoản khóa nhưng mật khẩu sai sẽ nhận 401 vì bcrypt được kiểm tra trước is_active.

### Nhóm test nhập điểm

API chính: `PUT /api/grades/enrollment/:enrollmentId`. Dùng tài khoản giảng viên có hồ sơ teachers và lớp học phần phụ trách trên dữ liệu test riêng.

| Mã | Nhóm | Dữ liệu / thao tác | Kết quả mong đợi theo code |
|---|---|---|---|
| GR01 | Hợp lệ | CC=8, GK=7, CK=9, đúng lớp | 200; tổng kết 8,30; B+; PASSED; trả grade ID |
| GR02 | Biên hợp lệ | CC/GK trống, CK=0; rồi CK=10 | Chấp nhận cả hai biên; tổng kết lần lượt 0/F/FAILED và 10/A+/PASSED |
| GR03 | Thành phần tùy chọn | Bỏ CC hoặc GK, CK=8 | Chấp nhận; tổng kết dùng CK = 8, không chia lại trọng số |
| GR04 | Chuẩn hóa | CC/GK trống, CK=`8,125` | Chấp nhận dấu phẩy; chuẩn hóa và trả tổng kết 8,13 |
| GR05 | Bắt buộc | CK trống, null hoặc chỉ có khoảng trắng | UI chặn; gọi API trực tiếp trả 400 “Thiếu Điểm cuối kỳ” |
| GR06 | Ngoài khoảng | Bất kỳ thành phần có giá trị -0.01, 10.001 hoặc 11 | UI chặn/API 400; kiểm tra khoảng trước khi làm tròn |
| GR07 | Không phải số | `abc`, `NaN`, `Infinity` | UI chặn/API 400; không ghi điểm |
| GR08 | Ngưỡng đạt/rớt | CC/GK trống, CK=4.99 rồi CK=5 | 4,99 → F/FAILED; 5 → D/PASSED |
| GR09 | Định dạng số hiện có | CK=`1e1` | Code dùng Number nên chấp nhận như 10; đây là hành vi hiện tại, không giả định chỉ nhận dạng thập phân thông thường |
| GR10 | Sai vai trò/lớp | STUDENT gọi PUT; TEACHER sửa lớp người khác | 403; không ghi dữ liệu |
| GR11 | Không tồn tại | Enrollment ID không tồn tại | 404 “Không tìm thấy lượt đăng ký” |
| GR12 | Lịch sử | Đổi tổng điểm của grade đã tồn tại | Cập nhật grade và thêm lịch sử với điểm cũ/mới, người sửa, lý do |
| GR13 | Lịch sử | Sửa điểm thành phần nhưng tổng điểm sau làm tròn không đổi | Không tạo thêm lịch sử theo điều kiện hiện tại |
| GR14 | Lưu nhiều dòng | Một dòng hợp lệ, một dòng bị lỗi | Dòng thành công được giữ; dòng lỗi giữ draft; hiển thị số thành công/thất bại |
| GR15 | Nhất quán | Giả lập lỗi DB sau UPDATE và trước khi transaction hoàn tất | Rollback transaction của request đó; kiểm tra lại cả grades và grade_history trong DB thử |
| GR16 | UI/async | Double-click Lưu; refetch khi đang sửa; đổi lớp/trang lúc có draft | Chặn gửi lặp, giữ draft và cảnh báo rời trang; kết quả chính thức lấy từ API |

Với các ca có ghi DB, kiểm tra cả HTTP response lẫn dữ liệu sau reload. “Lưu tất cả” là nhiều request/transaction riêng, không phải transaction cho toàn bộ bảng. Lỗi mạng sau khi gửi chưa chứng minh server chưa commit; phải kiểm tra dữ liệu trước khi gửi lại.

**Nguồn:** [login frontend](../fe-react/src/features/auth/LoginPage.jsx), [auth controller](../be/controllers/authController.js), [middleware](../be/middleware/auth.js), [routes điểm](../be/routes/grades.js), [controller điểm](../be/controllers/gradesController.js), [utility điểm](../be/utils/grade.js), [service điểm](../be/services/gradeService.js), [validation frontend](../fe-react/src/features/grade-entry/gradeDraft.js), [test nhập điểm](../fe-react/src/features/grade-entry/GradeEntryPage.test.jsx).

## Slide 24 — Xử lý lỗi và kết quả kiểm thử

### Nội dung đưa lên slide

- Trả lỗi rõ ràng theo nhóm: **400 đầu vào, 401 xác thực, 403 quyền, 404 tài nguyên, 409 xung đột, 500 lỗi nội bộ**.
- Dùng try/catch và rollback cho tạo sinh viên, lưu điểm và xử lý từng dòng import.
- Frontend hiển thị lỗi, giữ dữ liệu đang nhập và không tự retry thao tác ghi.
- Đã có kiểm tra API thật cho sai mật khẩu, token sai, GET ngoài quyền và API không tồn tại; các ca ghi lỗi phần lớn mới được kiểm tra bằng fixture.

### Kịch bản và nơi xử lý

| HTTP / kết quả | Kịch bản | Hàm / cơ chế xử lý | Bằng chứng hiện có |
|---|---|---|---|
| 400 | Thiếu username/password | `login` ném HttpError, route `wrap` chuyển lỗi về handler | Có xử lý trong code; không suy ra mọi biến thể đã kiểm thử API thật |
| 400 | Điểm sai khoảng, không phải số, thiếu CK | `parseScore` trong `updateGrade`; handler trả message | Validation/fixture nhập điểm đạt theo nhật ký; lưu biên vào DB thật còn chờ |
| 400 | Workbook không đọc được, rỗng, thiếu cột hoặc quá 5.000 dòng | `importGrades` có try/catch đọc XLSX và kiểm tra cấu trúc | Fixture đạt; chưa nghiệm thu upload với DB thật |
| 400 | File vượt 5 MB | Multer phát `LIMIT_FILE_SIZE`, handler đổi thành 400 | Nhật ký có kiểm tra biên Multer; không đồng nghĩa import nghiệp vụ thật đã đạt |
| 401 | Sai mật khẩu; token không hợp lệ; thiếu token | `login`; try/catch của `auth` quanh jwt.verify | Nhật ký ghi sai mật khẩu/token sai/GET không token đã kiểm tra thật |
| 403 | Login tài khoản khóa | `login` kiểm tra is_active | Fixture đạt; login sau khóa tài khoản thử thật chưa nghiệm thu |
| 403 | Role không được phép; giảng viên đọc lớp không phụ trách | `requireRole`; `assertOfferingAccess` | GET ngoài quyền đã kiểm tra thật; quyền của request ghi còn cần kiểm tra riêng |
| 404 | Sinh viên, enrollment hoặc grade không tồn tại | `transcript`, `myTranscript`, `updateGrade`, `deleteGrade` | Có nhánh xử lý; bảng điểm 404 có fixture; chưa khẳng định tất cả endpoint đã chạy thật |
| 404 | URL `/api/...` không tồn tại | JSON 404 đặt sau các route, trước static frontend | Đã kiểm tra qua proxy và Express thật theo nhật ký |
| 409 | Trùng mã SV/tài khoản; đăng ký trùng; xóa SV đã có đăng ký/điểm | Catch lỗi SQL trong `create`, `enroll`, `remove` | UI/fixture quản trị đạt; các lỗi ghi DB thật còn chờ nghiệm thu |
| 500 | Truy vấn hoặc lỗi nội bộ không được ánh xạ riêng | `wrap(...).catch(next)` → handler log lỗi và trả “Lỗi máy chủ” | Có handler và fixture lỗi; chưa có bằng chứng đã gây lỗi DB thật rồi xác minh phục hồi đầy đủ |
| 503 | Chọn frontend React nhưng thiếu bản build | `createFrontendMiddleware` trả hướng dẫn build/rollback | Static test với thư mục fixture đã kiểm tra; không phá bản build thật |
| HTTP 200 + `failed/errors` | Một số dòng import sai SV/môn/học kỳ/điểm | Catch từng dòng, rollback dòng đó, thêm row/message; tiếp tục các dòng sau | Fixture partial import đạt; chưa nghiệm thu partial import ghi thật |

**Điểm cần nói chính xác:** Import lỗi theo dòng vẫn có thể trả HTTP 200, kể cả khi mọi dòng thất bại; client phải đọc `failed` và `errors`. Lỗi đầu file như thiếu cột mới kết thúc request với 400. Phản hồi chỉ chứa tối đa 100 chi tiết lỗi, trong khi failed là tổng số dòng thất bại.

### Các khối bắt lỗi đáng chú ý

- [auth.js](../be/middleware/auth.js): bắt token sai/hết hạn; helper `wrap` chuyển Promise rejection sang Express error handler.
- [studentsController.js](../be/controllers/studentsController.js): tạo sinh viên và user trong transaction; rollback khi lỗi; ánh xạ trùng dữ liệu/FK khi tạo và lỗi RESTRICT khi xóa.
- [gradesController.js](../be/controllers/gradesController.js): rollback khi lưu điểm thất bại; try/catch đọc workbook và xử lý từng dòng import; giải phóng connection trong finally.
- [server.js](../be/server.js): handler lỗi tập trung; kết nối MySQL lỗi khi startup thì ghi log và thoát, chưa listen HTTP — trường hợp đó không phải một HTTP 500 đã trả cho client.
- [apiClient.js](../fe-react/src/services/apiClient.js): phân biệt lỗi HTTP, mạng và hủy request; [adminFeedback.js](../fe-react/src/features/users/adminFeedback.js) nhắc kiểm tra lại dữ liệu khi không biết kết quả ghi.

### Kết quả được ghi nhận trong nhật ký ngày 06/11

- 143/143 component tests đạt, sử dụng fixture/mock transport.
- Production E2E: 47 đạt, 1 skip; gồm 33 fixture, 13 ca auth/đọc/tải mẫu thật và 1 ca HTTP production thật.
- 3/3 static tests và 1/1 rollback Express thật đạt.
- Đây là kết quả lịch sử, không phải lần chạy lại của tài liệu này. Một handler tồn tại hoặc test fixture đạt không chứng minh tất cả tình huống server/DB thật đã được xử lý thành công.

**Nguồn kết quả:** [ma trận C01–C21 và nhật ký giai đoạn 8](./react-migration-progress.md), [test static](../be/tests/frontend.test.js), [test rollback](../be/tests/frontend-live.test.js), [cấu hình phục vụ frontend](../be/config/frontend.js).

## Slide 25 — Cài đặt và chạy local

### Nội dung đưa lên slide

**Clone → cài dependency → tạo DB thử → cấu hình môi trường → build React → chạy Express → mở trình duyệt.**

Yêu cầu: Git, Node.js/npm, MySQL 8.x đang chạy; lệnh mysql có trong PATH. Theo manifest React, Node phải thỏa `^22.13.0 || ^24.0.0 || >=26.0.0`. Các lệnh dưới dùng PowerShell trên Windows, `npm.cmd` tránh trường hợp PowerShell chặn npm.ps1.

### Bước 1 — Clone repository

Chạy từ thư mục cha dùng để chứa bản clone mới, không chạy clone đè lên workspace đang có:

```powershell
git clone https://github.com/Qangter/ltw_new2.git
Set-Location .\ltw_new2
git switch frontend-react
```

URL lấy từ Git remote `origin`. Nhánh frontend-react hiện có local và remote-tracking trong workspace. Chưa xác minh quyền truy cập remote bằng clone mới; nếu repo yêu cầu đăng nhập, dùng tài khoản GitHub có quyền.

**Giới hạn tái lập:** Working tree hiện có thay đổi chưa commit, gồm cấu hình phục vụ React qua Express và các chức năng mới. Clone chỉ lấy code đã push; không tự có các thay đổi local đó. Nhóm cần commit/push phiên bản đã kiểm tra trước khi dùng hướng dẫn này để tái lập đầy đủ bản hiện tại. Tài liệu này không thực hiện commit/push.

### Bước 2 — Cài thư viện

Từ root repository:

```powershell
npm.cmd --prefix be install
npm.cmd --prefix fe-react ci
```

Backend dùng lệnh install theo README; frontend React dùng ci để cài đúng lockfile.

### Bước 3 — Khởi tạo database, chỉ dành cho cài mới

**Script có `DROP DATABASE IF EXISTS diem_thi`: sẽ xóa database cùng tên nếu nó đã tồn tại. Chỉ dùng trên MySQL dành riêng cho demo/cài mới, nơi không có dữ liệu cần giữ. Nếu đã có DB đang dùng, bỏ qua bước này.**

README dùng chuyển hướng `<`; trong PowerShell, có thể gọi lệnh SOURCE của MySQL để nạp cùng script, từ root repository:

```powershell
mysql -u root -p --execute="source database/full_setup.sql"
mysql -u root -p --execute="source database/verify.sql"
```

Nhập mật khẩu MySQL khi được hỏi; không ghi mật khẩu trực tiếp vào câu lệnh. Lệnh đầu tạo schema và dữ liệu mẫu, lệnh sau đọc các kiểm tra dữ liệu. Chỉ cài một lần, không chạy setup/reset mỗi lần khởi động. Nếu chưa có mysql trong PATH, dùng đường dẫn đến mysql.exe hoặc MySQL Workbench theo README database.

### Bước 4 — Cấu hình backend

Trên bản clone mới, tạo file cấu hình nếu chưa có:

```powershell
if (-not (Test-Path -LiteralPath '.\be\.env')) {
    Copy-Item -LiteralPath '.\be\.env.example' -Destination '.\be\.env'
}
```

Mở file vừa tạo trong editor và chỉnh `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=diem_thi`; đặt `JWT_SECRET` riêng; chọn `PORT=3000`, **`FRONTEND=react`**. Không dùng lại giá trị mật khẩu mẫu một cách máy móc. Script start:react dưới đây chọn mode React rõ ràng; không giả định file mẫu đã đặt sẵn mode này.

### Bước 5 — Kiểm tra và build frontend

```powershell
npm.cmd --prefix fe-react run lint
npm.cmd --prefix fe-react test
npm.cmd --prefix fe-react run build
```

Các lệnh này có trong hướng dẫn build; component tests dùng fixture, không thay thế nghiệm thu DB thật.

### Bước 6 — Chạy bản React qua Express

```powershell
npm.cmd --prefix be run start:react
```

Mở **http://localhost:3000/#/login**. Express phục vụ cả bản build và API. Backend chỉ listen sau khi kiểm tra kết nối MySQL thành công. Dừng bằng Ctrl+C.

Nếu muốn chạy cổng khác:

```powershell
npm.cmd --prefix be run start:react -- 3001
```

Mở **http://localhost:3001/#/login**. Không chạy hai server trên cùng cổng.

### Chạy frontend React ở chế độ phát triển

Phát triển React: terminal 1 chạy backend, terminal 2 chạy Vite, đều từ root:

```powershell
# Terminal 1
npm.cmd --prefix be start
```

```powershell
# Terminal 2
npm.cmd --prefix fe-react run dev
```

Mở **http://127.0.0.1:5173/#/login**. Nếu backend đổi cổng, cấu hình `API_PROXY_TARGET` theo [mẫu frontend](../fe-react/.env.example), rồi restart Vite.

Để trình diễn bản React đã build, dừng Vite/backend phát triển khi cần và dùng `npm.cmd --prefix be run start:react`. Nếu bản clone chưa có script này, cần phiên bản có đầy đủ cấu hình và script phục vụ React đã bàn giao; không coi clone thiếu thay đổi local là bản demo hoàn chỉnh.

**Nguồn:** [README gốc](../README.md), [README React](../fe-react/README.md), [README database](../database/README.md), [script setup](../database/full_setup.sql), [script verify](../database/verify.sql), [mẫu backend](../be/.env.example), [manifest backend](../be/package.json), [manifest React](../fe-react/package.json); URL repository từ `git remote -v`.

## PHẦN 6 — Kết quả và đánh giá

## Slide 26 — Kịch bản demo 1 phút

### Nội dung đưa lên slide

**Admin tạo sinh viên kèm tài khoản → Giảng viên thêm sinh viên vào lớp và nhập điểm → Sinh viên xem bảng điểm/GPA.**

### Chuẩn bị trước khi bắt đầu bấm giờ

- Dùng dữ liệu demo/development riêng, không thao tác trên dữ liệu cần bảo toàn. Đây là kịch bản đề xuất, chưa được thực hiện trong lần biên soạn.
- Chọn mã mới chưa tồn tại, ví dụ `DEMO20261108`; chuẩn bị họ tên, ngày sinh, lớp và năm nhập học hợp lệ. Backend tạo username `demo20261108`, mật khẩu mặc định `student123` theo form hiện tại.
- Chọn trước một lớp học phần mà giảng viên demo thực sự phụ trách; ghi nhớ học kỳ tương ứng. Không đoán ID lớp chỉ từ tên môn.
- Dùng ba hồ sơ trình duyệt độc lập cho Admin, Giảng viên và Sinh viên; hai hồ sơ đầu đăng nhập sẵn. Không dùng ba tab chung localStorage vì đổi tài khoản ở tab này có thể thay phiên tab khác.
- Có thể mở và điền sẵn form Admin nhưng chưa bấm lưu; hồ sơ giảng viên mở sẵn đúng lớp; hồ sơ sinh viên ở màn hình đăng nhập, chưa login tài khoản chưa được tạo. Cách chuẩn bị này giúp trình diễn vừa một phút.

### Timeline 60 giây

| Thời gian | Người thao tác | Thao tác / lời nói |
|---|---|---|
| 00–15 giây | Admin | Ở Quản lý sinh viên, kiểm tra form đã điền và bấm “Lưu sinh viên”. Nói: “Admin tạo hồ sơ; hệ thống đồng thời tạo tài khoản sinh viên.” |
| 15–28 giây | Giảng viên | Chuyển sang cửa sổ giảng viên, nhập mã `DEMO20261108` vào ô thêm sinh viên ở lớp phụ trách, bấm “Thêm sinh viên vào lớp”. |
| 28–43 giây | Giảng viên | Ở dòng mới, nhập CC=8, GK=7, CK=9; bấm Lưu. Chỉ vào tổng kết **8,30 — B+ — Đạt** sau phản hồi thành công. |
| 43–56 giây | Sinh viên | Đăng nhập `demo20261108` / `student123`; mở Bảng điểm của tôi và chọn đúng học kỳ nếu cần. Chỉ vào môn vừa nhập và GPA **8,30**. |
| 56–60 giây | Người thuyết trình | “Ba vai trò cùng làm việc trên dữ liệu tập trung; điểm và GPA do backend tính, sinh viên tra cứu ngay sau khi lưu.” |

### Điều kiện để kết quả demo đúng

- Hệ thống **không có chức năng Admin tạo tùy ý tài khoản giảng viên mới** trong UI hiện tại; tạo tài khoản ở đây là tạo sinh viên, backend tự tạo user STUDENT kèm theo. Giảng viên dùng tài khoản đã chuẩn bị.
- Tạo hồ sơ sinh viên chưa tự đăng ký vào lớp học phần; phải giữ bước thêm sinh viên vào lớp trước khi nhập điểm.
- Sinh viên mới chỉ có một môn đã có điểm nên GPA = tổng kết môn đó = 8,30; nếu có thêm điểm, GPA phụ thuộc tín chỉ và phạm vi học kỳ.
- Giao diện có thể định dạng số thành `8.3`; đó vẫn là cùng giá trị 8,30. Không mô tả sai thành thiếu độ chính xác.
- Chỉ chuyển bước khi UI báo lưu thành công; nếu mạng chậm, ưu tiên trình bày kết quả thật thay vì cố giữ đúng thời lượng. Các thao tác ghi cần được chạy thử trên DB demo trước buổi trình bày.

**Nguồn:** [form sinh viên](../fe-react/src/features/students/StudentFormDialog.jsx), [tạo user kèm hồ sơ](../be/controllers/studentsController.js), [model sinh viên](../be/models/studentModel.js), [màn hình nhập điểm](../fe-react/src/features/grade-entry/OfferingEditor.jsx), [utility điểm](../be/utils/grade.js), [giao diện bảng điểm](../fe-react/src/features/transcripts/TranscriptView.jsx).

## Slide 27 — Mục tiêu và kết quả thực tế

### Nội dung đưa lên slide

- Đã triển khai chuỗi nghiệp vụ chính: **đăng nhập → phân quyền → nhập điểm → tra cứu → thống kê**.
- Có quản lý sinh viên/tài khoản, import Excel và lịch sử thay đổi tổng điểm.
- Có frontend React/Vite với component, router và query cache; backend Express kết nối MySQL, hỗ trợ chạy local.
- Đã kiểm tra nhiều luồng đọc thật; còn hoàn thiện kiểm thử ghi DB và các giới hạn bảo mật/nghiệp vụ.

### Bảng đối chiếu

Đây là đối chiếu với các yêu cầu thường gặp của một hệ thống quản lý điểm cơ bản, không phải bộ tiêu chí nghiệm thu đã được một trường xác nhận.

| Mục tiêu | Hiện trạng trong source | Đánh giá |
|---|---|---|
| Đăng nhập và phân quyền 3 vai trò | bcrypt, JWT, middleware role, guard/menu frontend | Đã code; login/đọc ngoài quyền có kiểm tra thật; thu hồi JWT còn hạn chế |
| Quản lý hồ sơ sinh viên | Tạo/sửa/xóa có điều kiện; tạo user đi kèm | Đã code; fixture đạt; CRUD DB thật chưa nghiệm thu đầy đủ |
| Quản lý tài khoản | Danh sách, lọc, khóa/mở khóa, reset mật khẩu | Đã code; chưa có tạo tùy ý mọi loại tài khoản trong UI |
| Nhập/sửa/xóa điểm | Kiểm tra 0–10, quyền lớp, tính điểm, transaction | Đã code; đọc lớp thật đạt; các thao tác ghi còn cần nghiệm thu |
| Tra cứu bảng điểm và GPA | Tra cứu SV, lọc học kỳ, GPA thang 10 có trọng số tín chỉ | Đã code và đối chiếu dữ liệu React với API thật |
| Nhập Excel | Mẫu tải về, xử lý từng dòng, báo thành công/thất bại | Đã code; tải mẫu thật đạt; upload/partial import thật và B02 chưa hoàn tất |
| Thống kê | Dashboard, theo môn/học kỳ, điểm chữ, sinh viên theo khoa | Đã code và đối chiếu API đọc thật |
| Theo dõi sửa điểm | Lưu điểm tổng kết cũ/mới, người sửa, lý do | Đã có; chưa là audit log đầy đủ cho điểm thành phần/tạo/xóa |
| Giao diện dùng trên nhiều kích thước | Responsive, loading/error/empty, modal, in bảng điểm | Có kiểm tra Chrome; chưa bao phủ mọi browser/thiết bị |
| Quản lý danh mục và quy trình học vụ mở rộng | CSDL có danh mục nhưng chưa có CRUD đầy đủ; chưa có phúc khảo/phê duyệt điểm | Chưa đáp ứng đầy đủ |
| Triển khai | Vite build, Express phục vụ React và API cùng origin | Đã có cấu hình và kiểm tra local; chưa chứng minh deploy công khai |

**Câu kết cho slide:** “Đã xây dựng nền tảng quản lý và tra cứu điểm với các luồng cốt lõi; bước tiếp theo là hoàn tất nghiệm thu dữ liệu thật và mở rộng quy trình học vụ.”

**Nguồn:** [README](../README.md), [routes](../be/routes/), [service điểm](../be/services/gradeService.js), [model bảng điểm](../be/models/studentModel.js), [ma trận nghiệm thu](./react-migration-progress.md), [baseline nghiệp vụ](./react-migration-baseline.md).

## Slide 28 — Hạn chế và hướng phát triển

### Kết quả tìm TODO/FIXME

Không tìm thấy marker TODO hoặc FIXME trong lần quét lại backend, React src/E2E và SQL/database, với đuôi `.js`, `.jsx`, `.css`, `.html`, `.sql`; loại node_modules, dist và test-results. Đây là phạm vi quét cụ thể, không khẳng định mọi tài nguyên ngoài phạm vi đều không có marker.

Không có TODO/FIXME không có nghĩa đã hoàn thiện. Các hạn chế dưới đây được xác định từ implementation và nhật ký, không phải các TODO tự suy diễn.

### Nội dung đưa lên slide — hạn chế chính

- Kiểm thử ghi DB thật chưa đầy đủ; chưa nghiệm thu triển khai công khai và đa trình duyệt.
- JWT chưa thu hồi tức thời; quyền đọc và quyền import còn điểm cần hoàn thiện.
- Công thức điểm cố định, GPA chỉ thang 10; chưa có quy trình học lại/phúc khảo/phê duyệt.
- Lịch sử điểm chưa đầy đủ; chưa có CRUD cho toàn bộ danh mục học vụ.

### Bằng chứng chi tiết

| Hạn chế | Căn cứ trong mã nguồn / tài liệu |
|---|---|
| JWT cũ còn hiệu lực sau khóa/reset | [Middleware](../be/middleware/auth.js) chỉ verify chữ ký/thời hạn; không kiểm tra is_active mỗi request. B01 trong baseline. |
| Import có thể mất giới hạn giảng viên khi thiếu hồ sơ | [importGrades](../be/controllers/gradesController.js) có thể lấy teacherId undefined; [findImportOffering](../be/models/gradeModel.js) chỉ thêm điều kiện khi ID truthy. B02 chưa sửa. |
| Quyền đọc chưa lọc đồng nhất theo lớp giảng viên | Các API tra cứu/bảng điểm/danh sách/lịch sử/thống kê cho cả ADMIN và TEACHER; nhiều query không nhận teacher ID. |
| Cập nhật hồ sơ chưa bảo đảm nguyên tử toàn bộ | [studentModel.update](../be/models/studentModel.js) cập nhật students và users bằng hai query không cùng transaction; [controller update](../be/controllers/studentsController.js) chưa map FK lỗi như create. B03. |
| Email hồ sơ/tài khoản có thể khác nhau | Model update chỉ đồng bộ tên user, không đồng bộ email. B04; cần làm rõ quy tắc nghiệp vụ. |
| Tính điểm/GPA cố định | [grade.js](../be/utils/grade.js) giữ trọng số/ngưỡng; [getTranscript](../be/models/studentModel.js) chưa chọn lần học lại tốt nhất, chưa quy đổi thang 4. |
| Audit log chưa đầy đủ | [saveGrade](../be/services/gradeService.js) chỉ ghi lịch sử khi tổng điểm đổi; [schema](../database/02_schema.sql) xóa grade thì lịch sử liên quan bị CASCADE. |
| Import còn giới hạn | Chỉ đọc sheet đầu, không có API hủy transaction toàn file; khi import, CC/GK được đưa về null. |
| Phạm vi và nghiệm thu | Chưa có CRUD đầy đủ khoa/ngành/môn/giảng viên/học kỳ; chưa phúc khảo/phê duyệt; các ca ghi DB thật và Firefox/WebKit chưa nghiệm thu đầy đủ theo [nhật ký](./react-migration-progress.md). |

### Ba hướng phát triển

1. **Hoàn thiện bảo mật và tính nhất quán:** Từ chối import khi thiếu hồ sơ giảng viên; thống nhất quyền ở mức dữ liệu; bổ sung thu hồi phiên, transaction cập nhật hồ sơ và audit log đầy đủ.
2. **Mở rộng nghiệp vụ học vụ:** CRUD danh mục, cấu hình trọng số theo môn, quy tắc học lại/GPA thang 4, quy trình phúc khảo và phê duyệt/công bố điểm; bổ sung xuất bảng điểm Excel/PDF.
3. **Nâng mức kiểm thử và triển khai:** Dữ liệu test riêng cho E2E ghi thật, CI tự động, kiểm thử tải/đa trình duyệt; triển khai HTTPS, sao lưu và giám sát lỗi.

**Nguồn tổng hợp:** [baseline B01–B04](./react-migration-baseline.md), [nhật ký nghiệm thu](./react-migration-progress.md), [routes hiện có](../be/routes/).

## PHẦN 7 — Tổng kết

## Slide 29 — Điểm sáng kiến trúc và bài học

### Ba điểm sáng kiến trúc

1. **Tách trách nhiệm rõ:** Express Route khai báo endpoint/quyền, Controller điều phối, Model truy vấn; service tập trung tính/lưu điểm để dùng chung cho nhập tay và import.
2. **Mô hình dữ liệu quan hệ phù hợp:** Sinh viên đăng ký lớp học phần qua enrollments, grades gắn với enrollment; PK/FK/UNIQUE/CHECK hạn chế dữ liệu trùng/sai, transaction hỗ trợ nhất quán khi tạo hồ sơ và lưu điểm.
3. **Frontend React tách UI, state và truy cập API:** Component JSX hiển thị dữ liệu; React Router điều hướng; Auth Context quản lý phiên; service/query hook và TanStack Query quản lý dữ liệu server. Việc tính điểm/GPA ở backend giúp các màn hình dùng chung kết quả nghiệp vụ.

### Ba bài học kinh nghiệm

1. **Validation phải có ở server:** Ẩn nút hoặc chặn form chỉ giúp trải nghiệm; API phải kiểm tra role, lớp phụ trách và dữ liệu đầu vào trước khi ghi. Cần test cả biên 0/10, trường thiếu và quyền ngoài lớp.
2. **Async và state cần thiết kế rõ:** Gửi lặp, response đến sau logout, refetch ghi đè draft hoặc React key trùng có thể gây lỗi khó thấy; cần tách draft/cache, hủy hoặc bỏ phản hồi cũ và kiểm thử hành vi điều hướng.
3. **Test đạt phải gắn với phạm vi bằng chứng:** Fixture giúp kiểm tra UI và nhánh lỗi, nhưng không thay thế transaction/SQL thật; cần phân biệt “đã code”, “đã test mô phỏng” và “đã nghiệm thu API/DB”, đồng thời ghi lại cấu hình tái lập.

### Ghi chú thuyết trình

Đây là những bài học kỹ thuật rút ra từ cấu trúc source và các lỗi đã ghi nhận, không thay cho lời kể về phân công hay trải nghiệm cá nhân của từng thành viên. Không mô tả toàn bộ backend là MVC tuyệt đối: service lưu điểm hiện có SQL trực tiếp và View nằm ở frontend. Cũng không tuyên bố mọi cập nhật đã có transaction, vì cập nhật hồ sơ còn B03.

**Nguồn:** [cấu trúc backend](../be/), [service điểm](../be/services/gradeService.js), [schema](../database/02_schema.sql), [React API client](../fe-react/src/services/apiClient.js), [React auth session](../fe-react/src/features/auth/authSession.js), [draft nhập điểm](../fe-react/src/features/grade-entry/useGradeDrafts.js), [nhật ký lỗi key/cache/test](./react-migration-progress.md).

## Slide 30 — Kết luận và hỏi đáp

### Nội dung có thể đưa nguyên lên slide

**WEBSITE TRA CỨU KẾT QUẢ THI TRỰC TUYẾN**

Hệ thống đã triển khai các chức năng cốt lõi: phân quyền ba vai trò, quản lý và nhập điểm, tra cứu bảng điểm/GPA, import Excel và thống kê. Dự án sử dụng React/Vite với JavaScript, Express và MySQL để kết nối giao diện với dữ liệu học vụ tập trung.

Nhóm sẽ tiếp tục hoàn thiện kiểm thử dữ liệu thật, bảo mật và các quy trình học vụ mở rộng.

**Mã nguồn:** [github.com/Qangter/ltw_new2](https://github.com/Qangter/ltw_new2)

**Xin cảm ơn thầy/cô và các bạn đã lắng nghe!**  
**Q&A — Nhóm sẵn sàng trao đổi và tiếp nhận góp ý.**

### Ghi chú nguồn repository

Đường dẫn trên lấy trực tiếp từ `git remote -v`: origin fetch/push là `https://github.com/Qangter/ltw_new2.git`. Chỉ xác nhận đây là URL đã cấu hình; chưa kiểm tra quyền truy cập công khai hoặc mức đồng bộ của code local lên GitHub. Không gọi URL repository là website đã deploy.

### Câu hỏi có thể chuẩn bị thêm

- Vì sao grades liên kết với enrollment thay vì chỉ student và subject?
- GPA đang tính theo thang nào và xử lý môn không đạt ra sao?
- Middleware kiểm tra role khác gì controller kiểm tra quyền lớp?
- Khi một dòng Excel lỗi, các dòng hợp lệ còn lại được xử lý thế nào?
- Những phần nào đã kiểm thử API thật và phần nào còn dùng fixture?

**Nguồn nội dung:** [README](../README.md), [ma trận nghiệm thu](./react-migration-progress.md), Git remote tại thời điểm đối chiếu.
