# Kế hoạch chuyển frontend sang React — tài liệu giao việc cho AI

> **Cập nhật 08/11/2026:** Dự án hiện chỉ dùng React. Nội dung mô tả frontend cũ, yêu cầu giữ bản cũ và kết quả rollback bên dưới là hồ sơ lịch sử trước khi gỡ bản cũ, không phải hướng dẫn chạy hiện hành. Xem [README](../README.md), [frontend React](../fe-react/README.md) và [slide React 12–22](./noi-dung-slide-12-22.md). Các liên kết mã frontend cũ trỏ tới commit lưu trữ.

## 1. Mục tiêu và cách sử dụng

Xây dựng lại frontend bằng React, giữ nguyên chức năng, quyền truy cập và kết quả nghiệp vụ hiện tại; đồng thời cải thiện cấu trúc code, quản lý dữ liệu và trải nghiệm thao tác.

Tài liệu này là kế hoạch, chưa phải báo cáo đã triển khai. Tất cả 8 giai đoạn bên dưới đều chưa thực hiện.

**Cách giao việc:** gửi “Prompt chung” cùng prompt của một giai đoạn. Khi giai đoạn hoàn thành, kiểm tra kết quả rồi giao giai đoạn kế tiếp. Nếu tiếp tục bằng cuộc trò chuyện AI mới, yêu cầu AI đọc tài liệu này và nhật ký tiến độ trước khi làm.

Mỗi giai đoạn có đầu ra riêng và tiêu chí nghiệm thu. Không chỉ đánh giá bằng việc giao diện trông đúng hoặc build thành công.

## 2. Các quyết định mặc định

- Xây frontend mới trong thư mục dự kiến `fe-react/`, không ghi đè [frontend hiện tại](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/).
- Dùng React + Vite + JavaScript/JSX để hạn chế mở rộng phạm vi sang chuyển đổi TypeScript.
- Dùng React Router cho điều hướng; chọn HashRouter trong lần chuyển đổi này để giữ dạng URL `#/...` và giảm thay đổi cấu hình phục vụ trang. URL sạch bằng BrowserRouter là hạng mục tùy chọn sau này.
- Dùng TanStack Query cho dữ liệu server, Auth Context cho phiên đăng nhập, state cục bộ cho modal, bộ lọc và bản nháp form. Không đưa Redux vào mặc định.
- Dùng fetch trong một API client chung; React Hook Form cho các form thông thường. Bảng nhập điểm dùng state bản nháp theo enrollment ID.
- Tái sử dụng [CSS hiện có](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/css/style.css) và logo trước; chỉ cải thiện giao diện sau khi đảm bảo chức năng tương đương. Chưa thêm Tailwind, bộ UI lớn hoặc thư viện biểu đồ nếu không cần.
- Giữ endpoint, request/response, schema database và công thức nghiệp vụ. Backend vẫn quyết định quyền, điểm tổng kết, xếp loại và GPA.
- Khi phát triển, Vite proxy `/api` đến Express. Khi chuyển giao bản chạy thật tại giai đoạn 8, Express phục vụ bản build React cùng origin với API.
- Chọn phiên bản thư viện phù hợp Node thực tế, kiểm tra tài liệu tương ứng và lưu lockfile; không nâng cấp hàng loạt dependency backend.

React có hướng dẫn dùng build tool như Vite để xây ứng dụng từ đầu; lựa chọn SPA ở đây dựa trên việc dự án đã có backend Express riêng. Tham khảo [React](https://react.dev/learn/build-a-react-app-from-scratch). Proxy phát triển được cấu hình theo [Vite server options](https://vite.dev/config/server-options#server-proxy). Cập nhật cache sau mutation theo [TanStack Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).

## 3. Prompt chung — dùng cho mọi giai đoạn

```text
Bạn đang chuyển frontend dự án tra cứu kết quả thi từ HTML/CSS/JavaScript thuần sang React.
Đọc docs/ke-hoach-chuyen-frontend-react.md và nhật ký tiến độ nếu đã có.
Chỉ thực hiện giai đoạn được giao; hoàn thành code, kiểm tra và bàn giao giai đoạn đó.

Quy tắc:
1. Đọc hướng dẫn repository, git status và code liên quan trước khi sửa.
   Giữ nguyên mọi thay đổi có sẵn không thuộc công việc của bạn.
2. Giữ frontend cũ trong fe/ hoạt động. Xây frontend mới trong fe-react/.
3. Không thay đổi schema database, công thức điểm/GPA, quyền hoặc hợp đồng API.
   Nếu phát hiện lỗi backend chặn công việc, nêu bằng chứng và tách đề xuất sửa riêng.
   Giai đoạn 8 chỉ cho phép thay đổi cấu hình phục vụ frontend và script liên quan.
4. Không bọc nguyên ứng dụng DOM cũ vào React. Chuyển giao diện sang component,
   props, state và event handler; không dùng dangerouslySetInnerHTML cho dữ liệu API.
5. React Router + TanStack Query + Auth Context; JavaScript/JSX.
   Không thêm thư viện ngoài nhu cầu của giai đoạn hoặc tự mở rộng tính năng.
6. Dùng API thật khi môi trường có sẵn. Mock chỉ dùng cho test hoặc fixture được ghi rõ;
   không dùng mock để tuyên bố tích hợp backend đã hoàn tất.
7. Chỉ ghi dữ liệu thử vào môi trường development/test đã xác định; ưu tiên dữ liệu thử riêng.
   Không reset, seed lại hay xóa dữ liệu hiện có để làm cho test chạy được.
8. Phân biệt loading ban đầu, refetch nền, dữ liệu rỗng và lỗi.
   Không ghi đè dữ liệu người dùng đang nhập khi refetch.
9. Chạy lint/build và kiểm tra phù hợp cho phần thay đổi. Nêu rõ lệnh, kết quả,
   kiểm tra chưa chạy và lý do. Không tuyên bố kiểm thử thành công nếu chưa chạy.
10. Cập nhật docs/react-migration-progress.md: việc đã làm, file đã đổi,
    kiểm tra, hạn chế, quyết định và công việc chuyển giao. Không tự commit/push/deploy.

Cuối giai đoạn, báo cáo:
- Chức năng đã hoàn thành.
- File thay đổi chính.
- Kiểm tra đã chạy và kết quả.
- Cách chạy/xem thử.
- Điểm còn thiếu hoặc bị chặn.
- Đánh giá có đủ điều kiện sang giai đoạn tiếp theo hay chưa.
```

## 4. Tổng quan các giai đoạn

| Giai đoạn | Phạm vi | Điều kiện bàn giao chính |
|---|---|---|
| 1 | Khảo sát và chốt hợp đồng | Có danh sách màn hình, API, quyền và checklist đối chiếu |
| 2 | Khởi tạo và component chung | React chạy, build được; frontend cũ không bị ảnh hưởng |
| 3 | Đăng nhập, phiên và phân quyền | Đúng 3 vai trò, refresh phiên và xử lý hết hạn |
| 4 | Các trang đọc dữ liệu | Tra cứu, bảng điểm, thống kê, lịch sử đúng dữ liệu API |
| 5 | Quản trị sinh viên và tài khoản | CRUD/quản trị có validation, lỗi và cập nhật dữ liệu |
| 6 | Nhập và sửa điểm | Không mất bản nháp; lưu từng dòng/hàng loạt đúng |
| 7 | Import Excel | Upload/download đúng API, phản ánh lỗi từng dòng |
| 8 | Kiểm thử tổng thể và chuyển đổi | Build được phục vụ bởi Express, có cách quay lại bản cũ |

Thứ tự mặc định: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

### Giai đoạn 1 — Khảo sát và chốt phạm vi

**Mục tiêu:** AI hiểu code và nghiệp vụ thực tế trước khi viết React.

Nguồn chính: [app.js](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/js/app.js), [các template](https://github.com/Qangter/ltw_new2/blob/086ee19dbab7f6afbe2a85875579f006c23a09a2/fe/pages/), [routes](../be/routes/), [controllers](../be/controllers/), [gradeService](../be/services/gradeService.js), [server.js](../be/server.js), [README](../README.md).

**Prompt giao việc:**

```text
Thực hiện giai đoạn 1: khảo sát, chỉ đọc code ứng dụng và tạo tài liệu.

1. Liệt kê tất cả màn hình, route hash cũ, vai trò và hành động được phép.
2. Lập bảng màn hình → API → query/body → response → lỗi cần hiển thị.
   Kiểm tra code controller/model, không chỉ dựa vào README hoặc suy đoán.
3. Ghi rõ phân trang, metadata, session, in bảng điểm, import, lưu điểm và lịch sử.
4. Đọc quy tắc điểm rỗng/điểm 0, cách tính điểm, làm tròn, xếp loại và GPA.
   Phân biệt quy tắc backend với nhãn/hướng dẫn giao diện.
5. Đề xuất ánh xạ template/hàm view cũ sang page/component/hook mới.
6. Tạo docs/react-migration-baseline.md và docs/react-migration-progress.md.
   Baseline gồm checklist tương đương chức năng và ma trận quyền từng vai trò.
7. Ghi riêng lỗi hiện có hoặc điểm chưa rõ, không tự sửa ứng dụng ở giai đoạn này.
```

**Nghiệm thu:** kiểm kê đủ login, dashboard, lookup, bảng điểm bản thân/chi tiết, nhập điểm, danh sách điểm/lịch sử, import, thống kê, sinh viên, tài khoản, đổi mật khẩu. Mỗi tính năng có API và quyền được xác minh hoặc ghi rõ chưa xác minh.

### Giai đoạn 2 — Khởi tạo React và nền tảng giao diện

**Mục tiêu:** có khung chạy độc lập, thống nhất cấu trúc trước khi chuyển tính năng.

**Prompt giao việc:**

```text
Thực hiện giai đoạn 2 dựa trên baseline đã có.

1. Kiểm tra Node/npm; tạo fe-react bằng Vite React JavaScript và lưu lockfile.
2. Tổ chức src/app, components, features, services, hooks, utils và styles.
   Từng feature chứa page/component/hook riêng; không gom nghiệp vụ vào App.jsx.
3. Thiết lập scripts dev/build/preview/lint và nền tảng kiểm thử component phù hợp.
4. Dùng HashRouter, giữ ánh xạ route cũ theo baseline. Route chưa chuyển chỉ có
   thông báo chưa triển khai, không giả dữ liệu để trông như chức năng hoàn chỉnh.
5. Tạo AppLayout, Sidebar, Card, Badge, Pagination, EmptyState, Loading,
   Toast và Modal/ConfirmDialog. Modal có nhãn, focus ban đầu, trả focus,
   xử lý bàn phím/Escape và giữ focus trong modal.
6. Tái sử dụng CSS và logo, giữ tiếng Việt, kiểm tra sidebar/bảng ở màn hình nhỏ.
7. Cấu hình Vite proxy /api tới backend hiện tại, không hardcode URL ở từng page.
8. Không chỉnh Express để chuyển frontend mặc định ở giai đoạn này.
```

**Nghiệm thu:** lint/build đạt; có hướng dẫn chạy hai server; React tải được asset, gọi API qua proxy; frontend cũ vẫn chạy. Chưa coi các trang placeholder là hoàn thành.

### Giai đoạn 3 — API client, xác thực và phân quyền

**Prompt giao việc:**

```text
Thực hiện giai đoạn 3.

1. Tạo API client dùng fetch: Bearer token, JSON, FormData, blob,
   query parameters, AbortSignal và lỗi có HTTP status.
2. Tạo AuthProvider/useAuth: trạng thái đang xác minh, chưa đăng nhập, đã đăng nhập.
   Khi khởi động, xác minh token bằng /api/auth/me trước khi mở trang bảo vệ.
3. Giữ cơ chế token hiện tại để tương thích. Không coi user/role trong localStorage
   là bằng chứng quyền đã xác thực; xử lý storage hỏng và hết hạn hợp lý.
4. Hoàn thiện login, logout, đổi mật khẩu, menu theo role và route guard.
   Phân biệt 401 cần kết thúc phiên với 403 cần hiển thị không có quyền.
5. Khởi tạo QueryClient, quy ước query keys chứa đủ bộ lọc/page/ID.
   Hủy request và xóa cache dữ liệu theo phiên khi logout/đổi tài khoản.
   Phản hồi request cũ không được làm thay đổi phiên đăng nhập mới.
6. Không retry tự động thao tác ghi; không retry lỗi xác thực/phân quyền.
7. Viết kiểm tra trọng tâm cho khôi phục phiên, hết hạn, route guard và cache logout.
```

**Nghiệm thu:** đăng nhập được với 3 vai trò; tải lại trang đúng phiên; truy cập URL trái quyền bị chặn; logout không còn dữ liệu tài khoản cũ; mật khẩu sai/lỗi mạng được hiển thị đúng. Backend tiếp tục là nơi thực thi quyền thực sự.

### Giai đoạn 4 — Các trang đọc dữ liệu

**Prompt giao việc:**

```text
Thực hiện giai đoạn 4: chuyển dashboard, thống kê, tra cứu sinh viên,
bảng điểm bản thân/chi tiết, danh sách điểm và modal lịch sử chỉnh sửa.

1. Tách service/query hook theo feature; kết nối endpoint và response thật.
2. Dùng chung TranscriptView cho bảng điểm bản thân và bảng điểm của sinh viên
   được staff xem, nhưng chọn đúng endpoint/quyền của từng trường hợp.
3. Giữ bộ lọc và page trong query string của route hash nếu phù hợp;
   đổi bộ lọc thì reset page; Back/Forward và refresh khôi phục được bộ lọc.
4. Query key gồm đủ bộ lọc và page; phản hồi cũ không ghi đè kết quả mới.
5. Giữ server-side pagination, số liệu và định dạng hiện có.
   Không tự tải toàn bộ dữ liệu rồi tính lại GPA/thống kê ở client.
6. Thực hiện trạng thái loading, rỗng, lỗi, retry; dùng lại chart CSS nếu đủ.
7. Giữ chức năng in bảng điểm: ẩn sidebar, nút và bộ lọc khi in,
   kiểm tra bảng dài và nội dung không bị che/cắt bởi vùng cuộn.
8. Đối chiếu kết quả React với bản cũ trên cùng bộ lọc và tài khoản.
```

**Nghiệm thu:** đầy đủ các trang đọc; kết quả, phân trang và thống kê khớp API; đổi bộ lọc nhanh không hiện sai dữ liệu; sinh viên chỉ xem được bảng điểm bản thân; xem trước bản in hợp lý.

### Giai đoạn 5 — Quản lý sinh viên và tài khoản

**Prompt giao việc:**

```text
Thực hiện giai đoạn 5, chỉ các nghiệp vụ quản trị đã tồn tại trong baseline.

1. Chuyển danh sách/thêm/sửa/xóa sinh viên; giữ quy tắc tạo tài khoản đi kèm
   theo backend, không tự tạo một luồng API mới.
2. Chuyển danh sách tài khoản, bật/tắt hoạt động và đặt lại mật khẩu.
3. Dùng form có validation tại trường, trạng thái đang gửi và lỗi server rõ ràng.
   Giữ nội dung đã nhập khi gửi thất bại; ngăn gửi trùng.
4. Xác nhận xóa, khóa tài khoản hoặc đặt lại mật khẩu bằng dialog rõ đối tượng.
5. Hiển thị đúng lỗi nghiệp vụ: mã trùng, dữ liệu không hợp lệ,
   sinh viên có đăng ký/điểm không thể xóa, không đủ quyền.
6. Invalidate các query liên quan sau thành công; giữ bộ lọc/phân trang hợp lý,
   xử lý khi xóa dòng cuối của trang cuối.
7. Kiểm tra quyền ADMIN và trường hợp backend từ chối thao tác.
```

**Nghiệm thu:** thao tác thành công cập nhật màn hình; lỗi không làm mất form; không có tính năng quản trị mới ngoài hệ thống cũ; account và student hiển thị nhất quán sau thay đổi liên quan.

### Giai đoạn 6 — Nhập điểm, sửa điểm và lưu hàng loạt

**Mục tiêu:** giữ chính xác nghiệp vụ và bảo vệ dữ liệu người dùng đang nhập.

**Prompt giao việc:**

```text
Thực hiện giai đoạn 6, đọc kỹ baseline và gradeService/controller trước khi sửa.

1. Chuyển lựa chọn học kỳ → lớp học phần → danh sách sinh viên.
   Có trạng thái học kỳ rỗng, không có lớp và lớp chưa có sinh viên.
2. Tạo draft theo enrollment_id, phân biệt dữ liệu server với dữ liệu đang sửa;
   theo dõi dirty, saving, error và saved cho từng dòng.
3. Validation theo backend; phân biệt điểm 0 với bỏ trống và không tự đổi
   quy tắc bắt buộc/điểm thành phần. Hiển thị kết quả chính thức từ API trả về.
4. Lưu từng dòng và chỉ lưu các dòng thay đổi khi Lưu tất cả.
   Dùng endpoint từng dòng hiện có, không giả định có API batch/transaction.
   Báo rõ số thành công, thất bại và lỗi từng dòng; giữ bản nháp của dòng lỗi.
5. Không cho refetch tự ghi đè draft. Khóa dòng khi lưu hoặc quản lý revision
   để phản hồi lưu cũ không xóa một chỉnh sửa mới hơn.
6. Cảnh báo khi rời trang/đổi lớp/đổi học kỳ khi có draft chưa lưu;
   dùng cách phù hợp với router đã chọn và kiểm thử thực tế.
7. Chuyển thêm sinh viên vào lớp và xóa điểm. Sau khi tạo điểm, dùng grade ID
   trong response để hỗ trợ xóa/lịch sử đúng mà không cần reload cả trang.
8. Cập nhật cache bảng điểm, danh sách điểm, lịch sử và thống kê liên quan,
   nhưng không làm mất các draft chưa lưu khác.
9. Kiểm tra điểm 0, biên hợp lệ, ngoài khoảng, thiếu thành phần theo hợp đồng,
   lưu một phần thất bại, bấm lặp, đổi lớp và giáo viên truy cập lớp ngoài quyền.
```

**Nghiệm thu:** không mất draft; kết quả lưu hiển thị đúng API; lưu tất cả không báo thành công toàn bộ khi một số dòng thất bại; lỗi quyền được xử lý; lịch sử và số liệu liên quan được cập nhật sau thao tác thành công.

### Giai đoạn 7 — Import Excel

**Prompt giao việc:**

```text
Thực hiện giai đoạn 7.

1. Tải file mẫu qua API có xác thực dưới dạng blob và thu hồi object URL sau dùng.
2. Chọn file, kiểm tra loại/kích thước theo giới hạn backend đã xác minh;
   upload bằng FormData với field file, không tự đặt Content-Type multipart.
3. Hiển thị tên file, trạng thái đang xử lý, chống gửi trùng;
   không tạo phần trăm tiến độ giả khi không có dữ liệu tiến độ thật.
4. Hiển thị total/created/updated/failed và lỗi theo số dòng từ response.
   Phân biệt import thành công một phần với lỗi toàn bộ request.
5. Giữ phân quyền giáo viên theo backend, không parse và tái triển khai
   nghiệp vụ import Excel ở trình duyệt.
6. Cập nhật các query điểm/bảng điểm/thống kê và dữ liệu khác thực sự bị
   tác động theo baseline sau khi import có thay đổi thành công.
7. Kiểm tra file hợp lệ, file rỗng/sai định dạng/quá giới hạn,
   dòng sai mã SV/môn/học kỳ và giáo viên không có quyền.
8. Không tự retry request import khi mất mạng; báo trạng thái chưa xác định
   nếu server có thể đã xử lý, hướng dẫn kiểm tra dữ liệu trước khi gửi lại.
```

**Nghiệm thu:** download/upload hoạt động với API thật khi môi trường sẵn sàng; số liệu và lỗi theo dòng đúng; chỉ cập nhật hiển thị theo kết quả backend, không giả định toàn bộ import là một transaction.

### Giai đoạn 8 — Hoàn thiện, kiểm thử và chuyển sang React

**Prompt giao việc:**

```text
Thực hiện giai đoạn 8 sau khi checklist các giai đoạn trước đã được đối chiếu.

1. Rà soát tương đương chức năng theo baseline với ADMIN, TEACHER, STUDENT.
   Sửa lỗi frontend trong phạm vi chuyển đổi, không thêm tính năng nghiệp vụ mới.
2. Hoàn thiện layout responsive, bảng dài, modal, focus bàn phím,
   thông báo lỗi, loading và CSS in bảng điểm.
3. Chạy lint/build, kiểm tra component/integration quan trọng và smoke/E2E
   các luồng đăng nhập → xem dữ liệu → thay đổi → kiểm tra kết quả.
   Có coverage hành vi cho nhập điểm/lưu một phần/import/logout đổi người dùng.
4. Nếu thiếu MySQL/backend/browser, ghi rõ kiểm tra nào chưa thực hiện;
   mock/test component không thay thế nghiệm thu tích hợp thật.
5. Chỉnh be/server.js chỉ ở phần static frontend: hỗ trợ lựa chọn bản cũ
   hoặc fe-react/dist bằng cấu hình rõ ràng. Giữ API routes và JSON 404 /api
   trước static middleware; không trả HTML cho API không tồn tại.
6. Giữ HashRouter đã chọn. Kiểm tra asset, vào trực tiếp route hash,
   refresh, URL không hợp lệ và trường hợp thư mục build chưa tồn tại.
7. Viết script/hướng dẫn build và chạy. Chạy thử Express phục vụ bản production
   build, không chỉ xác nhận Vite dev server hoặc preview chạy được.
8. Viết hướng dẫn rollback bằng cấu hình quay về fe/ rồi restart,
   không xóa frontend cũ, không reset dữ liệu, không tự deploy lên server ngoài.
9. Cập nhật README và nhật ký: kiến trúc, lệnh chạy, cấu hình,
   ma trận kiểm tra cuối cùng và các hạn chế còn lại.
```

**Nghiệm thu cuối:** đủ tính năng, đúng quyền, không sai dữ liệu điểm, build production chạy qua Express, API giữ nguyên hành vi, có hướng dẫn chạy và rollback đã kiểm tra. Nếu còn kiểm thử tích hợp bị chặn, ghi trạng thái “chưa nghiệm thu đầy đủ”, không đánh dấu hoàn tất toàn bộ.

## 5. Giao việc cho nhiều AI

- Thực hiện giai đoạn 1–3 theo thứ tự để thống nhất hợp đồng, cấu trúc, auth, query keys và component dùng chung.
- Sau giai đoạn 3, có thể chia giai đoạn 4–7 cho các AI riêng trong worktree riêng nếu có người tích hợp. Mỗi AI sở hữu feature rõ ràng và cùng tuân thủ baseline.
- Một đầu mối quản lý router, providers, API client, quy ước query keys và dependency. Các AI feature báo nhu cầu thay đổi những phần chung này để tích hợp có kiểm soát.
- Việc chạy test ghi dữ liệu đồng thời cần dữ liệu thử tách biệt; không cho các AI dùng cùng bản ghi thử cho lưu/xóa/import.
- Chạy lại kiểm tra tích hợp sau khi ghép các feature; việc từng nhánh build được chưa chứng minh ứng dụng tổng thể đúng.
- Nếu chỉ làm việc với một AI, giao lần lượt 8 giai đoạn là cách đơn giản nhất.

## 6. Mẫu lệnh giao việc nhanh

```text
Đọc docs/ke-hoach-chuyen-frontend-react.md và tuân thủ Prompt chung.
Đọc docs/react-migration-progress.md nếu đã có để tiếp tục đúng trạng thái.
Hãy thực hiện GIAI ĐOẠN 1 của kế hoạch, hoàn thành đầu ra và tiêu chí nghiệm thu.
Chỉ làm giai đoạn này, không tự chuyển sang giai đoạn tiếp theo.
Cuối cùng cập nhật nhật ký và báo cáo kết quả thực tế cùng hạn chế còn lại.
```

Thay số giai đoạn cho các lần giao việc tiếp theo. Chỉ chuyển tiếp khi đầu ra trước đã đủ làm nền tảng; nếu còn thiếu môi trường kiểm thử, giữ danh sách kiểm tra đang chờ và không coi chúng là đã đạt.
