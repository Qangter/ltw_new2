# Giải thích luồng hoạt động và các hàm quan trọng trong `app.js`

> **Cập nhật 08/11/2026:** Dự án hiện chỉ dùng React. Nội dung mô tả frontend cũ, yêu cầu giữ bản cũ và kết quả rollback bên dưới là hồ sơ lịch sử trước khi gỡ bản cũ, không phải hướng dẫn chạy hiện hành. Xem [README](../README.md), [frontend React](../fe-react/README.md) và [slide React 12–22](./noi-dung-slide-12-22.md). Các liên kết mã frontend cũ trỏ tới commit lưu trữ.

Tài liệu này diễn giải frontend tại [`fe/js/app.js`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/js/app.js), tập trung vào các hàm tạo nên luồng hoạt động của ứng dụng: khởi động, khôi phục phiên, điều hướng SPA, tải HTML, gọi API, đăng nhập, bảng điểm và nhập điểm. Phần giải thích dựa trên code hiện tại; nó không thay thế kiểm tra quyền ở backend.

## 1. Vai trò của `app.js` trong ứng dụng

`app.js` là mã JavaScript chính của giao diện. File không chứa markup của các màn hình; nó tải các khung HTML từ `fe/pages/*.html`, gắn sự kiện, gọi API và đưa dữ liệu phản hồi vào DOM. Trang gốc [`fe/index.html`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/index.html) cung cấp các vùng `#app`, `#toast`, `#templates` và nạp `js/app.js`.

Ứng dụng là SPA (Single-Page Application): trình duyệt tải một trang khung ban đầu; khi hash URL đổi, JavaScript thay nội dung vùng ứng dụng mà không tải lại toàn bộ trang. Ví dụ `#/entry` chọn màn hình nhập điểm. Các view được liên kết với hàm xử lý trong object `VIEWS` ở cuối file.

## 2. Các trạng thái dùng chung

### Phiên đăng nhập: `token` và `user` — dòng 19–23

- `token` lấy từ `localStorage` dưới khóa `token`; đây là JWT mà frontend sẽ gắn vào các request API.
- `user` được đọc từ JSON lưu dưới khóa `user`; frontend dùng thông tin này để hiển thị tên, vai trò, menu và chọn trang đầu.
- `meta` khởi tạo bằng `null`; nó giữ metadata dùng chung như học kỳ, lớp và môn học để tránh gọi lại API ở mỗi thao tác.

Các biến này là trạng thái ở trình duyệt, không phải nguồn xác thực có thẩm quyền. Backend vẫn phải xác minh JWT và quyền mỗi khi nhận request cần bảo vệ.

### Hàm tiện ích — dòng 4–17

- `$ (selector, root)` trả về phần tử DOM đầu tiên phù hợp với CSS selector; mặc định tìm trong `document`.
- `$$ (selector, root)` trả về danh sách kết quả dưới dạng mảng.
- `num(value)` làm tròn số tới hai chữ số thập phân; giá trị `null`/`undefined` được trình bày bằng dấu gạch.
- `fmtDate(value)` chuyển ngày dạng `YYYY-MM-DD` sang `DD/MM/YYYY`.
- `ROLE`, `RESULT`, `STATUS`, `GENDER` ánh xạ mã trong API thành nhãn tiếng Việt.

## 3. Tổng quan thứ tự khởi chạy

Khi file được nạp, phần cuối gọi hàm khởi tạo bất đồng bộ `init()` (dòng 839–850). Trình tự chính:

1. Nạp template dùng chung từ `pages/common.html` và gắn vào `#templates`.
2. Nếu tìm thấy `token` trong `localStorage`, gọi `GET /api/auth/me` để kiểm tra lại phiên và lấy thông tin người dùng mới nhất.
3. Nếu kiểm tra phiên thất bại, xóa thông tin phiên bằng `logout(false)`.
4. Gọi `render()` để hiển thị trang phù hợp với trạng thái đăng nhập và URL hash.

Sơ đồ:

```mermaid
flowchart TD
  A[Tải app.js] --> B[init]
  B --> C[Nạp common.html templates]
  C --> D{Có token lưu cục bộ?}
  D -- Không --> G[render]
  D -- Có --> E[GET /api/auth/me]
  E -->|Hợp lệ| F[Cập nhật user trong localStorage]
  E -->|Lỗi / 401| H[logout(false): xóa phiên]
  F --> G
  H --> G
  G --> I{Đã đăng nhập?}
  I -- Chưa --> J[renderLogin]
  I -- Rồi --> K[Chọn route, dựng shell và gọi VIEWS]
```

## 4. Tải HTML và ghép giao diện

### `loadPageHTML(name)` — dòng 97–104

Hàm tải nội dung `pages/${name}.html` bằng `fetch`. Kết quả được lưu trong object `pageCache`, vì vậy cùng một trang chỉ cần tải một lần trong vòng đời trang hiện tại. Ví dụ `loadPageHTML('entry')` lấy `pages/entry.html`.

### `mount(el, name)` — dòng 105–109

Hàm gọi `loadPageHTML(name)`, gán HTML nhận được vào phần tử `el` qua `innerHTML`, rồi trả lại phần tử đó. Các view thường `await mount(v, 'entry')` trước khi tìm input, bảng hoặc nút trong màn hình.

### `openModal(name)` — dòng 110 trở đi

Hàm nạp `pages/modals/<name>.html`, tạo overlay và hộp thoại, gắn chúng vào `document.body`, rồi trả về `{ bg, box }` để caller nối sự kiện hoặc điền nội dung. Nhấn vùng nền bên ngoài hộp thoại sẽ đóng modal.

### Các helper template — dòng 128 trở đi

- `clone(id)` sao chép nội dung một thẻ `<template>` đã được nạp vào `#templates`.
- `setF(root, field, value)` tìm phần tử `[data-f="field"]` và gán bằng `textContent`.
- `setBadge(...)` gán class và nhãn trạng thái cho huy hiệu.
- `fillOptions(...)` dựng các `<option>` cho ô chọn từ danh sách dữ liệu.
- `statCard(...)`, `barRow(...)`, `pieChart(...)` tạo các thành phần dashboard/thống kê từ dữ liệu đầu vào.
- `renderPager(...)` tạo nút phân trang và gọi callback khi người dùng chọn trang.

`textContent` được dùng khi đưa phần lớn giá trị dữ liệu vào các ô văn bản, giúp coi nội dung API là text thay vì HTML được thực thi.

## 5. Hàm `api`: đầu mối gọi backend — dòng 63–85

Chữ ký: `api(path, { method = 'GET', body, form, raw } = {})`.

### Trình tự xử lý

1. `setGlobalLoading(true)` tăng bộ đếm request và hiện trạng thái tải.
2. Tạo object `headers`; nếu có token, thêm `Authorization: Bearer <token>`.
3. Nếu có `form`, dùng trực tiếp FormData để gửi file. Nếu có `body`, JSON.stringify dữ liệu và thêm `Content-Type: application/json`.
4. Gửi `fetch('/api' + path, { method, headers, body: payload })`.
5. Nếu phản hồi là `401` và frontend đang có token, gọi `logout(false)` rồi phát sinh lỗi phiên hết hạn.
6. Nếu gọi với `raw: true` và phản hồi thành công, trả về `Blob` (ví dụ tải mẫu Excel).
7. Các phản hồi khác được đọc thành JSON. Nếu HTTP status không thành công, hàm ném `Error` với thông báo từ server nếu có; nếu thành công, trả JSON cho view.
8. Khối `finally` luôn gọi `setGlobalLoading(false)`, kể cả khi mạng/API báo lỗi.

Ví dụ request JSON:

```js
await api('/grades/enrollment/42', {
  method: 'PUT',
  body: { final_score: '8.5' }
});
```

Ví dụ upload FormData:

```js
const fd = new FormData();
fd.append('file', file);
await api('/import/grades', { method: 'POST', form: fd });
```

Trong upload, code không tự gán `Content-Type`; trình duyệt cần tự đặt multipart boundary cho FormData.

### `setGlobalLoading(active)` — dòng 36–61

Hàm dùng `pendingRequests` thay vì chỉ một cờ boolean. Mỗi request bắt đầu tăng bộ đếm; khi kết thúc giảm bộ đếm. Chỉ ẩn loading khi không còn request nào đang chạy. Nhờ vậy, request chạy song song không làm giao diện tắt loading quá sớm.

### `qs(object)` — dòng 86–87

Chuyển object bộ lọc thành query string. Các giá trị rỗng và `null` bị bỏ qua; giá trị còn lại được mã hóa bằng `encodeURIComponent`. Ví dụ `{ q: 'An Bình', page: 2 }` thành `q=An%20Bình&page=2`.

### `logout(redirect = true)` — dòng 89–95

Xóa token, user và cache metadata khỏi bộ nhớ; xóa `token`, `user` trong `localStorage`; tùy tham số có thể đổi hash sang `#/login`; cuối cùng gọi `render()` để dựng lại giao diện. Khi `api` gặp 401, nó truyền `false`, sau đó `render()` vẫn đưa người dùng về màn hình đăng nhập do `user` đã được xóa.

## 6. Điều hướng SPA: `MENU`, `render()` và `VIEWS`

### `MENU` — dòng 269–282

Mỗi phần tử menu có cấu trúc `[route, nhãn, danh sách role]`. Ví dụ `entry` có thể thấy bởi `ADMIN` và `TEACHER`, trong khi `my` dành cho `STUDENT`. Đây là cấu hình để dựng menu và lựa chọn điều hướng trên frontend.

### `render()` — dòng 298–341

1. Đọc `location.hash`, bỏ ký tự `#`/`/` đầu và tách route cùng tham số.
2. Nếu chưa có `user`, chỉ render form đăng nhập qua `renderLogin`.
3. Nếu đã đăng nhập, chọn trang mặc định: `my` cho `STUDENT`, `dashboard` cho vai trò còn lại.
4. Lọc menu theo role trong `MENU`. Nếu route không có trong menu của user, chuyển hash về trang mặc định. Route chi tiết `student/:id` được xử lý đặc biệt để sinh viên không thể mở bảng điểm người khác.
5. Nạp layout `shell`, tạo liên kết điều hướng, điền tên/vai trò và nối nút logout.
6. Hiện loading tại `#view`, gọi `VIEWS[page](view, param)` để view tự dựng màn hình và tải dữ liệu.
7. Nếu view ném lỗi, bắt lỗi và hiển thị thông báo trong vùng nội dung.

Listener `hashchange` ở dòng 341 gọi lại `render()` mỗi khi URL hash đổi.

### `VIEWS` — dòng 833–836

Object ánh xạ route đến hàm xử lý, ví dụ `entry: vEntry`, `my: vMy`, `dashboard: vDashboard`. `render` dùng bảng này làm điểm nối giữa URL và code của màn hình. Tham số thứ hai được chuyển vào view, cần thiết cho route tra cứu một sinh viên.

> **Giới hạn bảo mật cần nhớ:** lọc menu và chặn route trong `render()` chỉ kiểm soát hiển thị ở client. Người dùng có thể tự gửi request ngoài giao diện; vì vậy quyền thực sự phải được kiểm tra ở middleware/API backend. `app.js` chỉ gửi token và xử lý phản hồi.

## 7. Luồng đăng nhập: `renderLogin()` — dòng 346–362

1. Nạp `pages/login.html` vào vùng ứng dụng.
2. Gắn listener `submit` cho form `#lf`; `preventDefault()` ngăn trình duyệt tải lại trang.
3. Tạo `FormData` từ form và lấy `username`, `password`.
4. Gọi `POST /api/auth/login` qua helper `api`.
5. Khi thành công, nhận `token` và `user`, cập nhật biến trong bộ nhớ và lưu vào `localStorage`.
6. Chọn route theo role: sinh viên tới `#/my`, role còn lại tới `#/dashboard`, rồi gọi `render()`.
7. Nếu lỗi, hiển thị nội dung lỗi bằng `toast`.

Backend mới là nơi kiểm tra tài khoản/mật khẩu và tạo token; frontend chỉ gửi thông tin và lưu phản hồi. Do hàm `api` gắn Authorization khi có token, request login cũng sẽ có header đó nếu đã có token cũ; route đăng nhập backend không yêu cầu token.

## 8. Dashboard: `vDashboard(v)` — dòng 364 trở đi

View nạp `dashboard.html`, điền tên người dùng, rồi gọi đồng thời bốn API thống kê với `Promise.all`: `/stats/overview`, `/stats/by-semester`, `/stats/distribution`, `/stats/by-department`. Chỉ khi cả bốn Promise hoàn tất thì code mới tiếp tục dựng nội dung.

Kết quả tổng quan được đưa vào các thẻ `statCard`; dữ liệu theo học kỳ dựng thành biểu đồ thanh; phân bố điểm chữ và sinh viên theo khoa được chuyển thành donut qua `pieChart`. Dùng `Promise.all` cho phép các request độc lập bắt đầu song song, nhưng nếu một request reject thì toàn bộ biểu thức `Promise.all` reject và lỗi được `render()` bắt ở lớp ngoài.

## 9. Bảng điểm: `showTranscript()` và hai loader — dòng 385–446

`showTranscript(v, loader, canBack)` dùng chung cho bảng điểm cá nhân và trang xem bảng điểm sinh viên.

1. Nạp `transcript.html`; gọi `ensureMeta()` để lấy danh sách học kỳ dùng cho bộ lọc.
2. Nếu `canBack` đúng, hiện nút quay lại.
3. Hàm lồng `draw()` gọi `loader(semId)`; loader cung cấp dữ liệu học viên, điểm và summary.
4. Điền hồ sơ bằng `setF`/`setBadge`, dựng thẻ GPA, số môn, tín chỉ đạt/tổng và số môn chưa đạt.
5. Dựng lựa chọn học kỳ; nhóm các dòng điểm theo tên học kỳ; mỗi dòng hiển thị điểm thành phần, tổng, điểm chữ và kết quả.
6. Khi người dùng đổi học kỳ, cập nhật `semId` và gọi lại `draw()`.
7. Nút in gọi `window.print()`.

Hai loader khác nhau:

- `vMy` gọi `/students/me/transcript`; backend xác định hồ sơ từ user đã đăng nhập.
- `vStudent` gọi `/students/:id/transcript`; dành cho luồng tra cứu sinh viên của Admin/Giảng viên.

Tái sử dụng cùng view giúp giữ cách trình bày giống nhau, còn endpoint loader thể hiện nguồn dữ liệu và quyền khác nhau.

## 10. Nhập/sửa điểm: `vEntry()` — dòng 488–570

### Tải dữ liệu và dựng bảng

1. Nạp `entry.html`, gọi `ensureMeta()` để lấy học kỳ và metadata.
2. Chọn học kỳ đang hoạt động nếu có; nếu không, chọn học kỳ cuối danh sách.
3. `loadOfferings()` gọi `/offerings?semester_id=...`, điền danh sách lớp học phần. Nếu có offering, tiếp tục gọi `loadStudents()`.
4. `loadStudents()` gọi `/offerings/:id/students`, clone template hàng và điền mã/tên sinh viên, điểm hiện có, tổng điểm, điểm chữ, kết quả.
5. Mỗi hàng lưu `enrollment_id` vào `data-en`; nếu có điểm thì lưu `grade_id` vào `data-gid` và hiện nút xóa.

### Lưu một hàng: `saveRow(tr, silent)`

1. Đọc các input trong hàng theo `data-f` thành object `body`.
2. Kiểm tra nhanh phía giao diện rằng `final_score` không rỗng; nếu thiếu thì báo lỗi và không gửi request.
3. Gọi `PUT /grades/enrollment/:enrollmentId`, kèm các điểm và reason.
4. Nếu thành công, cập nhật tổng điểm, điểm chữ, badge kết quả từ response API; bỏ cờ dirty và hiển thị toast (trừ chế độ im lặng).
5. Nếu thất bại, hiển thị thông báo có mã sinh viên và lỗi từ API; trả về `false`.

### Lưu nhiều hàng

Khi input đổi, hàng nhận `data-dirty="1"`. Nút lưu tất cả lọc các hàng dirty rồi gọi `saveRow` lần lượt trong vòng lặp `for...of` và báo số hàng lưu thành công. Đây là nhiều request PUT độc lập được tuần tự gửi từ frontend, không phải một transaction duy nhất cho toàn bộ bảng.

### Xóa và thêm đăng ký

- Xóa điểm gọi `DELETE /grades/:id`, hỏi xác nhận trước, rồi tải lại bảng.
- Thêm sinh viên vào offering gọi `POST /offerings/:id/enroll` với `student_code`, rồi tải lại bảng.
- Thay học kỳ sẽ tải lại offerings; thay offering sẽ tải lại danh sách sinh viên.

Frontend chỉ kiểm tra trường cuối kỳ có rỗng hay không. Miền điểm 0–10, quyền giảng viên với lớp và các quy tắc nghiệp vụ còn lại phải do backend kiểm tra.

## 11. Metadata và cache: `ensureMeta()` — dòng 343–344

Nếu `meta` chưa được tải, hàm gọi `GET /api/meta` thông qua `api` rồi gán phản hồi vào biến dùng chung. Các view sau đó dùng dữ liệu cached cho dropdown, ví dụ học kỳ, lớp và môn học. Khi logout, `meta` được đặt lại `null` để phiên tiếp theo không dùng dữ liệu phiên trước.

## 12. Tóm tắt các luồng quan trọng

### Điều hướng một trang

`hashchange` → `render()` → kiểm tra trạng thái frontend → nạp `shell` → chọn `VIEWS[route]` → view `mount()` HTML → gọi `api()` → dựng DOM.

### Request được bảo vệ

View → `api()` thêm Bearer JWT → `fetch('/api/...')` → backend xác minh token/phân quyền → controller/model xử lý → JSON response → view cập nhật giao diện.

### Phiên không còn hợp lệ

API trả 401 khi frontend đang giữ token → `api()` gọi `logout(false)` → xóa phiên ở client → request báo lỗi → giao diện render trạng thái chưa đăng nhập.

## 13. Những điểm cần lưu ý khi trình bày code

- `localStorage` giúp giữ phiên sau tải lại trang, nhưng lưu token ở client không tự tạo ra bảo mật; backend vẫn phải verify token.
- Quyền menu trong `MENU` cải thiện trải nghiệm, không thay cho `requireRole` ở backend.
- `api()` là nơi tập trung header, chuyển JSON/FormData, chuyển lỗi HTTP thành Error và quản lý loading.
- Các view đặt logic dựng giao diện và gọi API gần nhau; template HTML giúp giữ markup ngoài JavaScript.
- Request dashboard chạy song song; nút lưu nhiều điểm chạy từng request tuần tự.
- `render()` bắt lỗi từ view, còn từng view cũng bắt lỗi ở các thao tác cần thông báo riêng bằng toast.

## 14. Bảng tra cứu hàm và vị trí

| Hàm / thành phần | Vai trò | Vị trí trong `fe/js/app.js` |
|---|---|---:|
| `$`, `$$`, `num`, `fmtDate` | Truy vấn DOM và định dạng | 6–12 |
| `toast` | Thông báo tạm thời | 26–34 |
| `setGlobalLoading` | Loading tổng hợp theo số request | 36–61 |
| `api` | Gửi request, token, body, lỗi | 65–85 |
| `qs` | Tạo query string | 87 |
| `logout` | Xóa phiên và render lại | 90–95 |
| `loadPageHTML`, `mount`, `openModal` | Tải HTML, ghép page/modal | 101–124 |
| `clone`, `setF`, `setBadge`, `fillOptions` | Dựng và điền template | 130–160 |
| `renderPager` | Phân trang giao diện | 227–260 |
| `MENU`, `render`, listener `hashchange` | Điều hướng SPA | 271–341 |
| `ensureMeta` | Nạp metadata dùng chung | 344 |
| `renderLogin` | Gửi thông tin đăng nhập và lưu phiên | 348–362 |
| `vDashboard` | Tải thống kê và dựng dashboard | 366–383 |
| `showTranscript`, `vMy`, `vStudent` | Dựng bảng điểm và bộ lọc học kỳ | 387–446 |
| `vEntry`, `loadOfferings`, `loadStudents`, `saveRow` | Dựng bảng và thao tác điểm | 488–570 |
| `vImport` | Tải mẫu và upload Excel | 575–609 |
| `vGrades` | Danh sách, bộ lọc, lịch sử điểm | 613–675 |
| `vStats` | Dựng trang thống kê | 677–697 |
| `vStudents` | CRUD sinh viên phía giao diện | 700–773 |
| `vUsers` | Trạng thái tài khoản/reset mật khẩu | 775–818 |
| `vPassword` | Form đổi mật khẩu | 820–830 |
| `VIEWS` | Ánh xạ route tới view | 833–836 |
| `init` | Tải template, khôi phục phiên, render đầu | 839–850 |

### File liên quan

- Trang gốc: [`fe/index.html`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/index.html)
- Template dùng chung: [`fe/pages/common.html`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/pages/common.html)
- Layout sau đăng nhập: [`fe/pages/shell.html`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/pages/shell.html)
- Form đăng nhập: [`fe/pages/login.html`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/pages/login.html)
- Màn hình nhập điểm: [`fe/pages/entry.html`](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/pages/entry.html)
- Router/API phía server: [`be/server.js`](../be/server.js), [`be/routes/`](../be/routes/)
